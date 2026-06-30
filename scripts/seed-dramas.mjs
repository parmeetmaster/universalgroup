import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "194.163.133.119",
  port: 3306,
  user: "chinese_drama",
  password: "asd1236547899",
  database: "chinese_drama",
  charset: "utf8mb4",
};

const IMAGEBAN_KEY = "HcllsPjSpOCGg9DMHzQaDeT3IXO2LAStS4c";

const DRAMAS = [
  { bookId: "42000014541", slug: "don-t-regret-when-she-let-go" },
  { bookId: "42000010883", slug: "think-again-im-the-hidden-boss-mom" },
  { bookId: "42000008760", slug: "the-day-my-stepbrother-knows-my-dirty-secret" },
  { bookId: "42000008774", slug: "craving-my-brothers-best-friend" },
  { bookId: "42000015277", slug: "vampire-elite-the-world-between-us" },
  { bookId: "42000010167", slug: "faking-it-with-the-hockey-captain" },
  { bookId: "42000010001", slug: "from-mail-order-bride-to-billionaires-wife" },
  { bookId: "42000007948", slug: "your-loser-husband-is-a-big-shot" },
  { bookId: "42000015757", slug: "guess-who-they-miss-now" },
  { bookId: "42000014893", slug: "fear-her-my-moms-the-lady-boss" },
  { bookId: "42000012143", slug: "lady-diamonds-lost-heiress-returns" },
  { bookId: "42000015264", slug: "no-escape-as-the-dragon-kings-mate" },
  { bookId: "41000121270", slug: "ruling-over-all-i-see-dubbed-" },
  { bookId: "42000013481", slug: "silence-boss-lady-speaks" },
  { bookId: "42000013483", slug: "revenge-puck" },
  { bookId: "42000012863", slug: "my-brothers-wrath-awaits" },
  { bookId: "42000009996", slug: "wait-our-great-grandma-is-18-years-old" },
  { bookId: "41000121501", slug: "move-to-countryside-marry-a-billionaire" },
  { bookId: "41000119953", slug: "queen-mom-rules" },
  { bookId: "41000102982", slug: "i-wish-it-were-you" },
  { bookId: "41000122689", slug: "a-deal-with-my-billionaire-donor" },
  { bookId: "42000001099", slug: "its-too-late-to-apologize" },
  { bookId: "42000001178", slug: "legally-sexy-and-mr-ice-cold" },
  { bookId: "42000003486", slug: "kissing-the-wrong-brother" },
  { bookId: "42000004343", slug: "if-i-never-loved-you" },
];

async function fetchDramaPage(bookId, slug) {
  const url = `https://www.dramaboxdb.com/movie/${bookId}/${slug}`;
  console.log(`  Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function extractDramaData(html, nextData) {
  let title = "", description = "", genres = [], episodeCount = 0, viewCount = 0;
  let coverUrl = "";
  let chapters = [];

  if (nextData?.props?.pageProps) {
    const pp = nextData.props.pageProps;
    const book = pp.bookInfo || pp.book || pp;

    title = book.bookName || book.name || "";
    description = book.introduction || book.desc || book.description || "";
    episodeCount = book.chapterCount || book.totalChapters || 0;
    viewCount = book.viewCount || book.views || 0;

    if (book.cover) {
      coverUrl = book.cover;
    }

    // Genre extraction
    if (book.typeTwoNames) {
      genres = Array.isArray(book.typeTwoNames) ? book.typeTwoNames : [book.typeTwoNames];
    } else if (book.labels) {
      genres = Array.isArray(book.labels) ? book.labels : [book.labels];
    }

    // Chapter list
    if (pp.chapterList) {
      chapters = pp.chapterList;
    } else if (pp.chapters) {
      chapters = pp.chapters;
    } else if (book.chapterList) {
      chapters = book.chapterList;
    }
  }

  // Fallback: extract from HTML meta tags
  if (!title) {
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (titleMatch) title = titleMatch[1];
  }
  if (!description) {
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (descMatch) description = descMatch[1];
  }
  if (!coverUrl) {
    const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (imgMatch) coverUrl = imgMatch[1];
  }

  return { title, description, genres, episodeCount, viewCount, coverUrl, chapters };
}

async function fetchEpisodePage(bookId, slug, chapterId) {
  const url = `https://www.dramaboxdb.com/ep/${bookId}_${slug}/${chapterId}_Episode-1`;
  console.log(`  Fetching episodes from: ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    console.log(`  Episode page returned ${res.status}, trying alternate URL...`);
    return null;
  }
  return await res.text();
}

function extractEpisodes(html) {
  const nextData = extractNextData(html);
  if (!nextData?.props?.pageProps) return [];

  const pp = nextData.props.pageProps;
  let chapters = pp.chapterList || pp.chapters || [];

  if (!Array.isArray(chapters) || chapters.length === 0) {
    // Try to find in nested structures
    if (pp.bookInfo?.chapterList) chapters = pp.bookInfo.chapterList;
  }

  return chapters.map((ch, idx) => {
    const chId = ch.chapterId || ch.id || ch.chapter_id;
    const epNum = ch.chapterIndex || ch.index || ch.episodeNumber || idx + 1;
    const videoUrl = ch.mp4 || ch.videoUrl || ch.video_url || ch.url || "";
    const thumbUrl = ch.cover || ch.thumbnail || ch.thumbnailUrl || "";
    return {
      chapterId: String(chId),
      episodeNumber: epNum,
      videoUrl,
      thumbnailUrl: thumbUrl,
    };
  });
}

async function uploadToImageBan(imageUrl) {
  try {
    console.log(`  Downloading poster: ${imageUrl}`);
    // Get higher quality image
    const highResUrl = imageUrl.replace(/@w=\d+&h=\d+/, "@w=480&h=720");
    const imgRes = await fetch(highResUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buffer.toString("base64");

    console.log(`  Uploading to ImageBan (${(buffer.length / 1024).toFixed(0)}KB)...`);
    const form = new FormData();
    form.append("image", base64);

    const uploadRes = await fetch("https://api.imageban.ru/v1", {
      method: "POST",
      headers: { Authorization: `Bearer ${IMAGEBAN_KEY}` },
      body: form,
    });

    const data = await uploadRes.json();
    if (data.success && data.data?.link) {
      console.log(`  Uploaded: ${data.data.link}`);
      return data.data.link;
    } else {
      console.log(`  ImageBan upload failed:`, JSON.stringify(data));
      return null;
    }
  } catch (e) {
    console.log(`  ImageBan error: ${e.message}`);
    return null;
  }
}

function generateDramaId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=== Chinese Drama DB Seeder ===\n");

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log("Connected to MySQL\n");

  // Step 1: Delete all existing data
  console.log("--- Step 1: Clearing existing data ---");
  await conn.execute("DELETE FROM episodes");
  await conn.execute("DELETE FROM drama_genres");
  await conn.execute("DELETE FROM dramas");
  console.log("All existing dramas, episodes, and genre links deleted.\n");

  // Get existing genres
  const [existingGenres] = await conn.execute("SELECT id, slug, name FROM genres");
  const genreMap = new Map();
  for (const g of existingGenres) {
    genreMap.set(g.slug, g.id);
    genreMap.set(g.name.toLowerCase(), g.id);
  }

  // Step 2: Process each drama
  console.log("--- Step 2: Processing dramas ---\n");

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < DRAMAS.length; i++) {
    const { bookId, slug } = DRAMAS[i];
    console.log(`\n[${i + 1}/${DRAMAS.length}] Processing bookId=${bookId}`);

    try {
      // Fetch movie page
      const movieHtml = await fetchDramaPage(bookId, slug);
      const nextData = extractNextData(movieHtml);
      const dramaData = extractDramaData(movieHtml, nextData);

      if (!dramaData.title) {
        console.log("  SKIP: Could not extract title");
        failCount++;
        continue;
      }

      console.log(`  Title: ${dramaData.title}`);
      console.log(`  Episodes: ${dramaData.episodeCount}, Views: ${dramaData.viewCount}`);
      console.log(`  Genres: ${dramaData.genres.join(", ") || "none"}`);

      // Get episodes from the chapter list or episode page
      let episodes = [];
      if (dramaData.chapters && dramaData.chapters.length > 0) {
        episodes = dramaData.chapters.map((ch, idx) => ({
          chapterId: String(ch.chapterId || ch.id || ""),
          episodeNumber: ch.chapterIndex || ch.index || idx + 1,
          videoUrl: ch.mp4 || ch.videoUrl || ch.video_url || "",
          thumbnailUrl: ch.cover || ch.thumbnail || "",
        }));
      }

      // If no chapters found in movie page, try episode page
      if (episodes.length === 0 || !episodes[0].videoUrl) {
        // Try to find first chapter ID from the page
        let firstChapterId = null;
        if (nextData?.props?.pageProps) {
          const pp = nextData.props.pageProps;
          firstChapterId =
            pp.firstChapterId || pp.bookInfo?.firstChapterId || pp.book?.firstChapterId;
          if (!firstChapterId && pp.chapterList?.length > 0) {
            firstChapterId = pp.chapterList[0].chapterId || pp.chapterList[0].id;
          }
        }
        // Fallback: try extracting from HTML links
        if (!firstChapterId) {
          const epLinkMatch = movieHtml.match(
            /\/ep\/\d+_[^/]+\/(\d+)_Episode/
          );
          if (epLinkMatch) firstChapterId = epLinkMatch[1];
        }

        if (firstChapterId) {
          await sleep(500);
          const epHtml = await fetchEpisodePage(bookId, slug, firstChapterId);
          if (epHtml) {
            episodes = extractEpisodes(epHtml);
          }
        }
      }

      console.log(`  Found ${episodes.length} episodes with data`);

      // Upload poster to ImageBan
      let posterUrl = dramaData.coverUrl || "";
      if (!posterUrl) {
        // Construct poster URL from bookId
        const prefix = bookId.substring(0, 2);
        const p2 = bookId.substring(0, 4);
        const p3 = bookId.substring(0, 5);
        posterUrl = `https://thwztchapter.dramaboxdb.com/data/cppartner/${prefix[0]}x${prefix[1]}/${p2.substring(0, 2)}x${p2.substring(2)}/${p3.substring(0, 3)}x${p3.substring(3)}/${bookId}/${bookId}.jpg@w=480&h=720`;
      }

      let imageBanUrl = null;
      if (posterUrl) {
        await sleep(1000); // Rate limit ImageBan
        imageBanUrl = await uploadToImageBan(posterUrl);
      }

      // Insert drama into DB
      const dramaId = generateDramaId(dramaData.title);
      const type = "short_drama";
      const origin = "chinese";
      const language = "subbed";

      const [insertResult] = await conn.execute(
        `INSERT INTO dramas (drama_id, name, description, type, origin, language, rating, episode_count, small_poster, large_poster, all_time_watch_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dramaId,
          dramaData.title,
          dramaData.description || null,
          type,
          origin,
          language,
          0,
          dramaData.episodeCount || episodes.length,
          imageBanUrl || posterUrl,
          imageBanUrl || posterUrl,
          dramaData.viewCount || 0,
        ]
      );

      const dramaSno = insertResult.insertId;
      console.log(`  Inserted drama sno=${dramaSno}, dramaId="${dramaId}"`);

      // Link genres
      for (const genreName of dramaData.genres) {
        const genreSlug = genreName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
        let genreId = genreMap.get(genreSlug) || genreMap.get(genreName.toLowerCase());

        if (!genreId) {
          // Create genre
          const [gResult] = await conn.execute(
            "INSERT INTO genres (name, slug) VALUES (?, ?)",
            [genreName, genreSlug]
          );
          genreId = gResult.insertId;
          genreMap.set(genreSlug, genreId);
          genreMap.set(genreName.toLowerCase(), genreId);
          console.log(`  Created genre: ${genreName} (id=${genreId})`);
        }

        await conn.execute(
          "INSERT IGNORE INTO drama_genres (drama_sno, genre_id) VALUES (?, ?)",
          [dramaSno, genreId]
        );
      }

      // Insert episodes
      let epInserted = 0;
      for (const ep of episodes) {
        if (!ep.videoUrl) continue;
        try {
          await conn.execute(
            `INSERT INTO episodes (drama_sno, episode_number, video_url, thumbnail_url)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE video_url = VALUES(video_url)`,
            [dramaSno, ep.episodeNumber, ep.videoUrl, ep.thumbnailUrl || null]
          );
          epInserted++;
        } catch (e) {
          // Skip duplicate or invalid
        }
      }
      console.log(`  Inserted ${epInserted} episodes`);

      successCount++;
      await sleep(800); // Rate limit between dramas
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      failCount++;
    }
  }

  // Update episode counts
  await conn.execute(`
    UPDATE dramas d SET episode_count = (
      SELECT COUNT(*) FROM episodes e WHERE e.drama_sno = d.sno
    )
  `);

  console.log(`\n=== DONE ===`);
  console.log(`Success: ${successCount}, Failed: ${failCount}`);

  // Show final state
  const [finalDramas] = await conn.execute(
    "SELECT sno, drama_id, name, episode_count, small_poster FROM dramas ORDER BY sno"
  );
  console.log(`\nDramas in DB: ${finalDramas.length}`);
  for (const d of finalDramas) {
    console.log(`  [${d.sno}] ${d.name} (${d.episode_count} eps) poster=${d.small_poster ? "YES" : "NO"}`);
  }

  await conn.end();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
