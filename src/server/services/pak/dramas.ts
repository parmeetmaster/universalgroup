import { query } from "@/lib/db";

// --------------- Types ---------------

interface ListDramasOpts {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  year?: number;
  genre_slug?: string;
  q?: string;
  sort?: "newest" | "popular" | "rating";
}

interface DramaRow {
  id: number;
  title: string;
  slug: string;
  synopsis: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  type: string;
  status: string;
  release_year: number | null;
  rating_avg: number | null;
  rating_count: number;
  total_seasons: number;
  total_episodes: number;
  language: string | null;
  is_featured: number;
  is_published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CreateDramaData {
  title: string;
  slug: string;
  synopsis?: string;
  poster_url?: string;
  backdrop_url?: string;
  trailer_url?: string;
  type?: string;
  status?: string;
  release_year?: number;
  language?: string;
  is_featured?: boolean;
  is_published?: boolean;
  source_url?: string;
  genreSlugs?: string[];
}

interface UpdateDramaData extends Partial<CreateDramaData> {
  rating_avg?: number;
  rating_count?: number;
  total_seasons?: number;
  total_episodes?: number;
}

// --------------- Public ---------------

export async function listDramas(opts: ListDramasOpts = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["d.is_published = 1", "d.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (opts.type) {
    conditions.push("d.type = ?");
    params.push(opts.type);
  }
  if (opts.status) {
    conditions.push("d.status = ?");
    params.push(opts.status);
  }
  if (opts.year) {
    conditions.push("d.release_year = ?");
    params.push(opts.year);
  }
  if (opts.q) {
    conditions.push("(d.title LIKE ? OR d.synopsis LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like);
  }

  let joinClause = "";
  if (opts.genre_slug) {
    joinClause =
      "JOIN drama_genres dg ON dg.drama_id = d.id JOIN genres g ON g.id = dg.genre_id AND g.slug = ?";
    params.push(opts.genre_slug);
  }

  let orderBy = "d.created_at DESC";
  if (opts.sort === "popular") orderBy = "d.rating_count DESC, d.rating_avg DESC";
  else if (opts.sort === "rating") orderBy = "d.rating_avg DESC, d.rating_count DESC";
  else if (opts.sort === "newest") orderBy = "d.release_year DESC, d.created_at DESC";

  const where = conditions.join(" AND ");

  const countSql = `SELECT COUNT(DISTINCT d.id) as total FROM dramas d ${joinClause} WHERE ${where}`;
  const countParams = [...params];

  const dataSql = `
    SELECT DISTINCT d.* FROM dramas d ${joinClause}
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const [countRows, rows] = await Promise.all([
    query("pak", countSql, countParams) as Promise<{ total: number }[]>,
    query("pak", dataSql, params) as Promise<DramaRow[]>,
  ]);

  const total = countRows[0]?.total ?? 0;

  return {
    items: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDrama(slug: string) {
  const rows = (await query(
    "pak",
    "SELECT * FROM dramas WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL",
    [slug]
  )) as DramaRow[];

  const drama = rows[0];
  if (!drama) return null;

  const [genres, cast, seasons] = await Promise.all([
    query(
      "pak",
      `SELECT g.id, g.name, g.slug, g.icon_url
       FROM genres g JOIN drama_genres dg ON dg.genre_id = g.id
       WHERE dg.drama_id = ?`,
      [drama.id]
    ) as Promise<{ id: number; name: string; slug: string; icon_url: string | null }[]>,
    query(
      "pak",
      `SELECT cm.id, cm.name, cm.slug, cm.photo_url
       FROM cast_members cm JOIN drama_cast dc ON dc.cast_member_id = cm.id
       WHERE dc.drama_id = ?`,
      [drama.id]
    ) as Promise<{ id: number; name: string; slug: string; photo_url: string | null }[]>,
    query(
      "pak",
      "SELECT * FROM seasons WHERE drama_id = ? ORDER BY number ASC",
      [drama.id]
    ) as Promise<unknown[]>,
  ]);

  return { ...drama, genres, cast, seasons };
}

export async function getRelatedDramas(slug: string) {
  const rows = (await query(
    "pak",
    `SELECT DISTINCT d2.* FROM dramas d1
     JOIN drama_genres dg1 ON dg1.drama_id = d1.id
     JOIN drama_genres dg2 ON dg2.genre_id = dg1.genre_id AND dg2.drama_id != d1.id
     JOIN dramas d2 ON d2.id = dg2.drama_id AND d2.is_published = 1 AND d2.deleted_at IS NULL
     WHERE d1.slug = ? AND d1.deleted_at IS NULL
     ORDER BY d2.rating_avg DESC
     LIMIT 12`,
    [slug]
  )) as DramaRow[];

  return rows;
}

export async function getSeasons(slug: string) {
  const rows = await query(
    "pak",
    `SELECT s.* FROM seasons s
     JOIN dramas d ON d.id = s.drama_id
     WHERE d.slug = ? AND d.is_published = 1 AND d.deleted_at IS NULL
     ORDER BY s.number ASC`,
    [slug]
  );
  return rows;
}

export async function getEpisodes(slug: string, seasonNumber: number) {
  const rows = await query(
    "pak",
    `SELECT e.id, e.drama_id, e.season_id, e.number, e.title, e.synopsis,
            e.air_date, e.is_published, e.source_url,
            e.created_at, e.updated_at,
            (SELECT ev.url FROM episode_videos ev
             WHERE ev.episode_id = e.id AND ev.is_active = 1
             ORDER BY ev.priority ASC LIMIT 1) AS playUrl
     FROM episodes e
     JOIN seasons s ON s.id = e.season_id
     JOIN dramas d ON d.id = e.drama_id
     WHERE d.slug = ? AND s.number = ? AND d.is_published = 1 AND d.deleted_at IS NULL
     ORDER BY e.number ASC`,
    [slug, seasonNumber]
  );
  return rows;
}

// --------------- Admin ---------------

export async function adminListDramas() {
  const rows = await query(
    "pak",
    "SELECT * FROM dramas ORDER BY created_at DESC"
  );
  return rows;
}

export async function createDrama(data: CreateDramaData) {
  const cols = [
    "title", "slug", "synopsis", "poster_url", "backdrop_url", "trailer_url",
    "type", "status", "release_year", "language", "is_featured", "is_published", "source_url",
  ] as const;

  const values: unknown[] = [
    data.title,
    data.slug,
    data.synopsis ?? null,
    data.poster_url ?? null,
    data.backdrop_url ?? null,
    data.trailer_url ?? null,
    data.type ?? "drama",
    data.status ?? "ongoing",
    data.release_year ?? null,
    data.language ?? null,
    data.is_featured ? 1 : 0,
    data.is_published ? 1 : 0,
    data.source_url ?? null,
  ];

  const placeholders = cols.map(() => "?").join(", ");
  const result = (await query(
    "pak",
    `INSERT INTO dramas (${cols.join(", ")}) VALUES (${placeholders})`,
    values
  )) as { insertId: number };

  const dramaId = result.insertId;

  if (data.genreSlugs?.length) {
    await linkGenres(dramaId, data.genreSlugs);
  }

  return { id: dramaId };
}

export async function updateDrama(id: number, data: UpdateDramaData) {
  const fields: string[] = [];
  const params: unknown[] = [];

  const map: Record<string, unknown> = {
    title: data.title,
    slug: data.slug,
    synopsis: data.synopsis,
    poster_url: data.poster_url,
    backdrop_url: data.backdrop_url,
    trailer_url: data.trailer_url,
    type: data.type,
    status: data.status,
    release_year: data.release_year,
    language: data.language,
    is_featured: data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : undefined,
    is_published: data.is_published !== undefined ? (data.is_published ? 1 : 0) : undefined,
    source_url: data.source_url,
    rating_avg: data.rating_avg,
    rating_count: data.rating_count,
    total_seasons: data.total_seasons,
    total_episodes: data.total_episodes,
  };

  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      params.push(val);
    }
  }

  if (fields.length === 0 && !data.genreSlugs) return;

  if (fields.length > 0) {
    params.push(id);
    await query("pak", `UPDATE dramas SET ${fields.join(", ")} WHERE id = ?`, params);
  }

  if (data.genreSlugs) {
    await linkGenres(id, data.genreSlugs);
  }
}

export async function deleteDrama(id: number) {
  await query(
    "pak",
    "UPDATE dramas SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
    [id]
  );
}

// --------------- Helpers ---------------

async function linkGenres(dramaId: number, slugs: string[]) {
  await query("pak", "DELETE FROM drama_genres WHERE drama_id = ?", [dramaId]);

  if (slugs.length === 0) return;

  const genres = (await query(
    "pak",
    `SELECT id FROM genres WHERE slug IN (${slugs.map(() => "?").join(",")})`,
    slugs
  )) as { id: number }[];

  if (genres.length === 0) return;

  const placeholders = genres.map(() => "(?, ?)").join(", ");
  const params = genres.flatMap((g) => [dramaId, g.id]);

  await query(
    "pak",
    `INSERT INTO drama_genres (drama_id, genre_id) VALUES ${placeholders}`,
    params
  );
}
