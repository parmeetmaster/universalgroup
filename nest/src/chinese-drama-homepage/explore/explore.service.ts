import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CdDrama } from '../entities/drama.entity';
import { DramaLanguage, DramaOrigin, DramaSortBy, DramaType, FilterRequestDto } from './explore.dto';

const RECOMMENDED_PAGE_SIZE = 60;
const GENRE_DATA_SIZE = 90;
const RANDOM_SIZE = 21;
const NEW_RELEASE_SIZE = 20;
const WEEKLY_POPULAR_SIZE = 10;
const NEW_RELEASE_TAB_SIZE = 40;
const FILTER_PAGE_SIZE = 60;
const ANIME_GRID_SIZE = 30;
const SEARCH_REC_SIZE = 10;
const SEARCH_REC_MOST_WATCHED = 3;
const TOP_SEARCH_SIZE = 20;
const TOP_TRENDING_SIZE = 20;
const NEW_RELEASE_GENRE_SIZE = 20;
const SEARCH_PAGE_SIZE = 30;

const SELECTED_FIELDS: (keyof CdDrama)[] = [
  'sno', 'dramaId', 'name', 'smallPoster', 'largePoster', 'createdAt', 'allTimeWatchCount', 'weeklyWatchCount',
];

@Injectable()
export class ExploreService {
  constructor(
    @InjectRepository(CdDrama, 'chinese-drama')
    private readonly dramaRepo: Repository<CdDrama>,
  ) {}

  async explore(genre: string | undefined | null, page: number) {
    const pageNum = Math.max(1, page || 1);
    const genreName = genre?.trim().toLowerCase() || null;
    const isFirstPage = pageNum === 1;

    const [randomItems, newRelease, { items: mostRecommended, total }] = await Promise.all([
      isFirstPage ? this.getRandomItems() : Promise.resolve([]),
      isFirstPage ? this.getNewRelease() : Promise.resolve([]),
      this.getMostRecommended(genreName, pageNum),
    ]);

    const totalPages = Math.ceil(total / RECOMMENDED_PAGE_SIZE);

    return {
      data: {
        randomItems: isFirstPage ? randomItems : [],
        newRelease: isFirstPage ? newRelease : [],
        mostRecommended,
      },
      page: pageNum,
      totalPages,
      total,
    };
  }

  async getByGenre(genre: string, page: number) {
    const genreName = genre.trim().toLowerCase();
    const pageNum = Math.max(1, page || 1);
    const offset = (pageNum - 1) * GENRE_DATA_SIZE;

    const idQb = this.dramaRepo
      .createQueryBuilder('d')
      .select(['d.sno', 'd.allTimeWatchCount'])
      .innerJoin('d.genres', 'gf', 'TRIM(LOWER(gf.name)) = :genreName', { genreName })
      .orderBy('d.allTimeWatchCount', 'DESC')
      .skip(offset)
      .take(GENRE_DATA_SIZE);

    const [idRows, total] = await idQb.getManyAndCount();
    const items = await this.loadWithGenres(idRows.map(r => r.sno), 'd.allTimeWatchCount', 'DESC');
    const totalPages = Math.ceil(total / GENRE_DATA_SIZE);

    return { data: items, page: pageNum, totalPages, total };
  }

  async getNewReleaseTab(page: number) {
    const pageNum = Math.max(1, page || 1);
    const isFirstPage = pageNum === 1;
    const offset = (pageNum - 1) * NEW_RELEASE_TAB_SIZE;

    const [weeklyPopular, { items: newRelease, total }] = await Promise.all([
      isFirstPage ? this.getWeeklyPopular() : Promise.resolve([]),
      this.getPaginatedByOrder('d.createdAt', 'DESC', offset, NEW_RELEASE_TAB_SIZE),
    ]);

    const totalPages = Math.ceil(total / NEW_RELEASE_TAB_SIZE);

    return {
      data: {
        weeklyPopular: isFirstPage ? weeklyPopular : [],
        newRelease,
      },
      page: pageNum,
      totalPages,
      total,
    };
  }

  async getAnimeGrid(page: number) {
    const pageNum = Math.max(1, page || 1);
    const offset = (pageNum - 1) * ANIME_GRID_SIZE;

    const idQb = this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .where('d.type = :type', { type: 'anime' })
      .orderBy('d.createdAt', 'DESC')
      .skip(offset)
      .take(ANIME_GRID_SIZE);

    const [idRows, total] = await idQb.getManyAndCount();
    const items = await this.loadWithGenres(idRows.map(r => r.sno), 'd.createdAt', 'DESC');
    const totalPages = Math.ceil(total / ANIME_GRID_SIZE);

    return { data: items, page: pageNum, totalPages, total };
  }

  async filterDramas(dto: FilterRequestDto) {
    const pageNum = Math.max(1, dto.page || 1);
    const offset = (pageNum - 1) * FILTER_PAGE_SIZE;

    const idQb = this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno');

    if (dto.type && dto.type !== DramaType.ALL) {
      idQb.andWhere('d.type = :type', { type: dto.type });
    }
    if (dto.origin && dto.origin !== DramaOrigin.ALL) {
      idQb.andWhere('d.origin = :origin', { origin: dto.origin });
    }
    if (dto.language && dto.language !== DramaLanguage.ALL) {
      idQb.andWhere('d.language = :language', { language: dto.language });
    }

    const genreName = dto.genre?.trim().toLowerCase() || null;
    if (genreName) {
      idQb.innerJoin('d.genres', 'gf', 'TRIM(LOWER(gf.name)) = :genreName', { genreName });
    }

    const orderCol = dto.sortBy === DramaSortBy.POPULAR ? 'd.allTimeWatchCount' : 'd.createdAt';
    idQb.addSelect(orderCol);
    idQb.orderBy(orderCol, 'DESC').skip(offset).take(FILTER_PAGE_SIZE);

    const [idRows, total] = await idQb.getManyAndCount();
    const items = await this.loadWithGenres(idRows.map(r => r.sno), orderCol, 'DESC');
    const totalPages = Math.ceil(total / FILTER_PAGE_SIZE);

    return { data: items, page: pageNum, totalPages, total };
  }

  async searchDramas(query: string, page: number) {
    const raw = query?.trim() || '';
    if (!raw) return { data: [], page: 1, totalPages: 0, total: 0 };

    const pageNum = Math.max(1, page || 1);
    const lowerQuery = raw.toLowerCase();
    const words = lowerQuery.split(/\s+/).filter(Boolean);

    if (words.length === 0) return { data: [], page: 1, totalPages: 0, total: 0 };

    // Collect IDs from all strategies, deduplicated, in priority order
    const collectedIds: number[] = [];
    const seen = new Set<number>();

    const addIds = (ids: number[]) => {
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          collectedIds.push(id);
        }
      }
    };

    // Strategy 1: All words match
    addIds(await this.searchIds(words, lowerQuery, 'all'));

    // Strategy 2: Any word matches
    if (collectedIds.length < SEARCH_PAGE_SIZE) {
      addIds(await this.searchIds(words, lowerQuery, 'any'));
    }

    // Strategy 3: SOUNDEX phonetic
    if (collectedIds.length < SEARCH_PAGE_SIZE) {
      addIds(await this.soundexIds(words));
    }

    // Strategy 4: Genre match
    if (collectedIds.length < SEARCH_PAGE_SIZE) {
      addIds(await this.genreSearchIds(lowerQuery));
    }

    // Strategy 5: Popular fallback
    if (collectedIds.length < SEARCH_PAGE_SIZE) {
      addIds(await this.popularIds(collectedIds.length));
    }

    // Paginate from collected IDs
    const total = collectedIds.length;
    const offset = (pageNum - 1) * SEARCH_PAGE_SIZE;
    const pageIds = collectedIds.slice(offset, offset + SEARCH_PAGE_SIZE);

    const items = await this.loadByFieldOrder(pageIds);
    const totalPages = Math.ceil(total / SEARCH_PAGE_SIZE);
    return { data: items, page: pageNum, totalPages, total };
  }

  private async searchIds(
    words: string[],
    lowerQuery: string,
    mode: 'all' | 'any',
  ): Promise<number[]> {
    const qb = this.dramaRepo.createQueryBuilder('d').select('d.sno');

    // Match across: name, alternativeNames, originalName
    const fieldMatch = (field: string, wordIdx: number) =>
      `LOWER(${field}) LIKE :w${wordIdx}`;

    const allFields = ['d.name', 'd.alternativeNames', 'd.originalName'];

    if (mode === 'all') {
      // Every word must appear in at least one of the fields
      words.forEach((word, i) => {
        const orAcrossFields = allFields.map(f => fieldMatch(f, i)).join(' OR ');
        qb.andWhere(`(${orAcrossFields})`, { [`w${i}`]: `%${word}%` });
      });
    } else {
      // Any word in any field
      const conditions: string[] = [];
      const params: Record<string, string> = {};
      words.forEach((word, i) => {
        allFields.forEach(f => conditions.push(fieldMatch(f, i)));
        params[`w${i}`] = `%${word}%`;
      });
      qb.andWhere(`(${conditions.join(' OR ')})`, params);
    }

    // Relevance: name match (high) > alternativeNames (mid) > originalName (low)
    qb.addSelect(
      `CASE
        WHEN LOWER(d.name) = :exactQ THEN 200
        WHEN LOWER(d.name) LIKE :startsQ THEN 180
        WHEN LOWER(d.name) LIKE :containsQ THEN 160
        WHEN LOWER(d.alternativeNames) LIKE :containsQ THEN 100
        WHEN LOWER(d.originalName) LIKE :containsQ THEN 20
        ELSE 40
      END`,
      'relevance',
    );
    qb.setParameters({
      exactQ: lowerQuery,
      startsQ: `${lowerQuery}%`,
      containsQ: `%${lowerQuery}%`,
    });

    qb.orderBy('relevance', 'DESC').addOrderBy('d.allTimeWatchCount', 'DESC');

    const rows = await qb.take(SEARCH_PAGE_SIZE).getRawMany();
    return rows.map(r => r.d_sno);
  }

  private async soundexIds(words: string[]): Promise<number[]> {
    const qb = this.dramaRepo.createQueryBuilder('d').select('d.sno');

    const conditions: string[] = [];
    const params: Record<string, string> = {};
    words.forEach((word, i) => {
      conditions.push(`SOUNDEX(d.name) LIKE CONCAT('%', SOUNDEX(:sx${i}), '%')`);
      conditions.push(`SOUNDEX(d.alternativeNames) LIKE CONCAT('%', SOUNDEX(:sx${i}), '%')`);
      params[`sx${i}`] = word;
    });

    qb.andWhere(`(${conditions.join(' OR ')})`, params);
    qb.orderBy('d.allTimeWatchCount', 'DESC');

    const rows = await qb.take(SEARCH_PAGE_SIZE).getRawMany();
    return rows.map(r => r.d_sno);
  }

  private async genreSearchIds(query: string): Promise<number[]> {
    const rows = await this.dramaRepo
      .createQueryBuilder('d')
      .select(['d.sno', 'd.allTimeWatchCount'])
      .innerJoin('d.genres', 'g', 'LOWER(g.name) LIKE :gq', { gq: `%${query}%` })
      .orderBy('d.allTimeWatchCount', 'DESC')
      .take(SEARCH_PAGE_SIZE)
      .getMany();
    return rows.map(r => r.sno);
  }

  private async popularIds(alreadyHave: number): Promise<number[]> {
    const need = SEARCH_PAGE_SIZE - alreadyHave;
    if (need <= 0) return [];

    const rows = await this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .orderBy('d.allTimeWatchCount', 'DESC')
      .take(need + SEARCH_PAGE_SIZE) // fetch extra so dedup still fills
      .getRawMany();
    return rows.map(r => r.d_sno);
  }

  private async loadByFieldOrder(ids: number[]): Promise<CdDrama[]> {
    if (ids.length === 0) return [];
    return this.dramaRepo
      .createQueryBuilder('d')
      .select(this.selectFields('d'))
      .leftJoin('d.genres', 'g')
      .addSelect(['g.id', 'g.name', 'g.slug'])
      .where('d.sno IN (:...ids)', { ids })
      .orderBy(`FIELD(d.sno, ${ids.join(',')})`)
      .getMany();
  }

  async getSearchRecommendations(genres: string[]) {
    const genreNames = genres.map(g => g.trim().toLowerCase()).filter(Boolean);

    const [searchRecommendations, topSearch, topTrending, newRelease] = await Promise.all([
      this.buildSearchRecommendations(genreNames),
      this.getTopSearch(),
      this.getTopTrending(),
      this.buildNewReleaseByGenres(genreNames),
    ]);

    return {
      data: {
        searchRecommendations,
        topSearch,
        topTrending,
        newRelease,
      },
    };
  }

  private async buildSearchRecommendations(genreNames: string[]): Promise<CdDrama[]> {
    if (genreNames.length === 0) {
      const idRows = await this.dramaRepo
        .createQueryBuilder('d')
        .select('d.sno')
        .orderBy('d.allTimeWatchCount', 'DESC')
        .take(SEARCH_REC_SIZE)
        .getMany();
      return this.loadWithGenres(idRows.map(r => r.sno), 'd.allTimeWatchCount', 'DESC');
    }

    // Get 3 most-watched dramas from the given genres
    const mostWatchedQb = this.dramaRepo
      .createQueryBuilder('d')
      .select(['d.sno', 'd.allTimeWatchCount'])
      .innerJoin('d.genres', 'g', 'TRIM(LOWER(g.name)) IN (:...genreNames)', { genreNames })
      .orderBy('d.allTimeWatchCount', 'DESC')
      .take(SEARCH_REC_MOST_WATCHED);

    const mostWatchedRows = await mostWatchedQb.getMany();
    const mostWatchedIds = mostWatchedRows.map(r => r.sno);

    // Get random dramas from given genres, excluding the most-watched ones
    const randomQb = this.dramaRepo
      .createQueryBuilder('d')
      .select(['d.sno'])
      .innerJoin('d.genres', 'g', 'TRIM(LOWER(g.name)) IN (:...genreNames)', { genreNames });

    if (mostWatchedIds.length > 0) {
      randomQb.andWhere('d.sno NOT IN (:...excludeIds)', { excludeIds: mostWatchedIds });
    }

    const randomRows = await randomQb
      .orderBy('RAND()')
      .take(SEARCH_REC_SIZE - mostWatchedIds.length)
      .getMany();

    const allIds = [...mostWatchedIds, ...randomRows.map(r => r.sno)];
    if (allIds.length === 0) return [];

    // Load full data, shuffle so most-watched are mixed in
    const items = await this.loadWithGenres(allIds, 'RAND()', 'ASC');
    return items;
  }

  private async getTopSearch(): Promise<CdDrama[]> {
    const idRows = await this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .where('d.searchSelectCount > 0')
      .orderBy('d.searchSelectCount', 'DESC')
      .take(TOP_SEARCH_SIZE)
      .getMany();
    return this.loadWithGenres(idRows.map(r => r.sno), 'd.searchSelectCount', 'DESC');
  }

  private async getTopTrending(): Promise<CdDrama[]> {
    // First try daily watch count
    const dailyRows = await this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .where('d.dailyWatchCount > 0')
      .orderBy('d.dailyWatchCount', 'DESC')
      .take(TOP_TRENDING_SIZE)
      .getMany();

    const dailyIds = dailyRows.map(r => r.sno);

    if (dailyIds.length >= TOP_TRENDING_SIZE) {
      return this.loadWithGenres(dailyIds, 'd.dailyWatchCount', 'DESC');
    }

    // Fill remaining from weekly watch count
    const remaining = TOP_TRENDING_SIZE - dailyIds.length;
    const weeklyQb = this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .where('d.weeklyWatchCount > 0')
      .orderBy('d.weeklyWatchCount', 'DESC')
      .take(remaining);

    if (dailyIds.length > 0) {
      weeklyQb.andWhere('d.sno NOT IN (:...excludeIds)', { excludeIds: dailyIds });
    }

    const weeklyRows = await weeklyQb.getMany();
    const allIds = [...dailyIds, ...weeklyRows.map(r => r.sno)];
    if (allIds.length === 0) return [];

    return this.loadWithGenres(allIds, 'd.weeklyWatchCount', 'DESC');
  }

  private async buildNewReleaseByGenres(genreNames: string[]): Promise<CdDrama[]> {
    let genreIds: number[] = [];

    if (genreNames.length > 0) {
      // Get new releases matching sent genres
      const genreRows = await this.dramaRepo
        .createQueryBuilder('d')
        .select(['d.sno', 'd.createdAt'])
        .innerJoin('d.genres', 'g', 'TRIM(LOWER(g.name)) IN (:...genreNames)', { genreNames })
        .orderBy('d.createdAt', 'DESC')
        .take(NEW_RELEASE_GENRE_SIZE)
        .getMany();
      genreIds = genreRows.map(r => r.sno);
    }

    if (genreIds.length >= NEW_RELEASE_GENRE_SIZE) {
      return this.loadWithGenres(genreIds, 'd.createdAt', 'DESC');
    }

    // Fill remaining with newest dramas regardless of genre
    const remaining = NEW_RELEASE_GENRE_SIZE - genreIds.length;
    const fillQb = this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .orderBy('d.createdAt', 'DESC')
      .take(remaining);

    if (genreIds.length > 0) {
      fillQb.andWhere('d.sno NOT IN (:...excludeIds)', { excludeIds: genreIds });
    }

    const fillRows = await fillQb.getMany();
    const allIds = [...genreIds, ...fillRows.map(r => r.sno)];
    if (allIds.length === 0) return [];

    return this.loadWithGenres(allIds, 'd.createdAt', 'DESC');
  }

  async incrementWatchCounts(dramaIds: string[]) {
    if (dramaIds.length === 0) return { success: true, updated: 0 };

    const result = await this.dramaRepo
      .createQueryBuilder()
      .update()
      .set({
        dailyWatchCount: () => 'daily_watch_count + 1',
        weeklyWatchCount: () => 'weekly_watch_count + 1',
        monthlyWatchCount: () => 'monthly_watch_count + 1',
        allTimeWatchCount: () => 'all_time_watch_count + 1',
      })
      .where('dramaId IN (:...dramaIds)', { dramaIds })
      .execute();
    return { success: true, updated: result.affected ?? 0 };
  }

  async incrementSearchSelect(dramaId: string) {
    await this.dramaRepo
      .createQueryBuilder()
      .update()
      .set({ searchSelectCount: () => 'search_select_count + 1' })
      .where('dramaId = :dramaId', { dramaId })
      .execute();
    return { success: true };
  }

  private selectFields(alias: string) {
    return SELECTED_FIELDS.map((f) => `${alias}.${f}`);
  }

  private async loadWithGenres(
    ids: number[],
    orderCol: string,
    orderDir: 'ASC' | 'DESC',
  ): Promise<CdDrama[]> {
    if (ids.length === 0) return [];
    return this.dramaRepo
      .createQueryBuilder('d')
      .select(this.selectFields('d'))
      .leftJoin('d.genres', 'g')
      .addSelect(['g.id', 'g.name', 'g.slug'])
      .where('d.sno IN (:...ids)', { ids })
      .orderBy(orderCol, orderDir)
      .getMany();
  }

  private async getRandomItems(): Promise<CdDrama[]> {
    const idRows = await this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .orderBy('RAND()')
      .take(RANDOM_SIZE)
      .getMany();
    return this.loadWithGenres(idRows.map(r => r.sno), 'RAND()', 'ASC');
  }

  private async getNewRelease(): Promise<CdDrama[]> {
    const idRows = await this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .orderBy('d.createdAt', 'DESC')
      .take(NEW_RELEASE_SIZE)
      .getMany();
    return this.loadWithGenres(idRows.map(r => r.sno), 'd.createdAt', 'DESC');
  }

  private async getWeeklyPopular(): Promise<CdDrama[]> {
    const idRows = await this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .orderBy('d.weeklyWatchCount', 'DESC')
      .take(WEEKLY_POPULAR_SIZE)
      .getMany();
    return this.loadWithGenres(idRows.map(r => r.sno), 'd.weeklyWatchCount', 'DESC');
  }

  private async getPaginatedByOrder(
    orderCol: string,
    orderDir: 'ASC' | 'DESC',
    offset: number,
    limit: number,
  ): Promise<{ items: CdDrama[]; total: number }> {
    const idQb = this.dramaRepo
      .createQueryBuilder('d')
      .select('d.sno')
      .orderBy(orderCol, orderDir)
      .skip(offset)
      .take(limit);

    const [idRows, total] = await idQb.getManyAndCount();
    const items = await this.loadWithGenres(idRows.map(r => r.sno), orderCol, orderDir);
    return { items, total };
  }

  private async getMostRecommended(
    genreName: string | null,
    page: number,
  ): Promise<{ items: CdDrama[]; total: number }> {
    const offset = (page - 1) * RECOMMENDED_PAGE_SIZE;

    const idQb = this.dramaRepo
      .createQueryBuilder('d');

    if (genreName) {
      idQb.select(['d.sno', 'd.createdAt']);
      idQb.innerJoin('d.genres', 'gf', 'TRIM(LOWER(gf.name)) = :genreName', { genreName });
      idQb.orderBy('d.createdAt', 'DESC');
    } else {
      idQb.select(['d.sno', 'd.allTimeWatchCount']);
      idQb.orderBy('d.allTimeWatchCount', 'DESC');
    }

    idQb.skip(offset).take(RECOMMENDED_PAGE_SIZE);

    const [idRows, total] = await idQb.getManyAndCount();
    const orderCol = genreName ? 'd.createdAt' : 'd.allTimeWatchCount';
    const items = await this.loadWithGenres(idRows.map(r => r.sno), orderCol, 'DESC');
    return { items, total };
  }
}
