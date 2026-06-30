import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { AnimeGridRequestDto, ExploreRequestDto, FilterRequestDto, GenreDataRequestDto, IncrementWatchDto, NewReleaseRequestDto, SearchRecommendationRequestDto, SearchRequestDto, SearchSelectDto } from './explore.dto';

@ApiTags('Chinese Drama - Explore')
@Controller('chinese-drama/explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Post()
  @ApiOperation({ summary: 'Get explore/home page data with random, new release, and recommended dramas' })
  @ApiBody({ type: ExploreRequestDto })
  @ApiResponse({ status: 200, description: 'Explore data with pagination' })
  async explore(@Body() dto: ExploreRequestDto) {
    return this.exploreService.explore(dto.genre, dto.page ?? 1);
  }

  @Post('new-release')
  @ApiOperation({ summary: 'Weekly popular (page 1 only) + new release dramas with pagination' })
  @ApiBody({ type: NewReleaseRequestDto })
  @ApiResponse({ status: 200, description: 'Weekly popular + paginated new releases (40 per page)' })
  async newRelease(@Body() dto: NewReleaseRequestDto) {
    return this.exploreService.getNewReleaseTab(dto.page ?? 1);
  }

  @Post('filter')
  @ApiOperation({ summary: 'Filter dramas by type, origin, language and sort by popular/latest' })
  @ApiBody({ type: FilterRequestDto })
  @ApiResponse({ status: 200, description: 'Filtered paginated dramas (60 per page)' })
  async filter(@Body() dto: FilterRequestDto) {
    return this.exploreService.filterDramas(dto);
  }

  @Post('anime')
  @ApiOperation({ summary: 'Get anime grid data — poster only, no title, 30 per page (3-row grid)' })
  @ApiBody({ type: AnimeGridRequestDto })
  @ApiResponse({ status: 200, description: 'Anime dramas with poster only, paginated' })
  async animeGrid(@Body() dto: AnimeGridRequestDto) {
    return this.exploreService.getAnimeGrid(dto.page ?? 1);
  }

  @Post('search')
  @ApiOperation({
    summary: 'Smart search — always returns results, even for vague/misspelled queries',
    description: `Case-insensitive smart search with 5 fallback strategies (tried in order until results found):\n\n` +
      `**1. All words match** — every word in query must appear in drama name (best precision)\n` +
      `**2. Any word match** — at least one word matches, ranked by how many words matched\n` +
      `**3. Phonetic match (SOUNDEX)** — catches misspellings/similar sounding names\n` +
      `**4. Genre match** — if the query is a genre name (e.g. "romance"), returns dramas of that genre\n` +
      `**5. Popular fallback** — if nothing matches at all, returns most popular dramas\n\n` +
      `Within each strategy, results are ranked by relevance (exact > starts with > contains) and popularity. Returns max 30 per page.`,
  })
  @ApiBody({ type: SearchRequestDto })
  @ApiResponse({ status: 200, description: 'Paginated search results ranked by relevance' })
  async search(@Body() dto: SearchRequestDto) {
    return this.exploreService.searchDramas(dto.query, dto.page ?? 1);
  }

  @Post('increment-watch')
  @ApiOperation({
    summary: 'Increment all watch counts (daily, weekly, monthly, allTime) by 1 for a drama',
    description: 'Increments dailyWatchCount, weeklyWatchCount, monthlyWatchCount, and allTimeWatchCount by 1. Call this when a user watches/opens a drama.',
  })
  @ApiBody({ type: IncrementWatchDto })
  @ApiResponse({ status: 200, description: 'All watch counts incremented' })
  async incrementWatch(@Body() dto: IncrementWatchDto) {
    return this.exploreService.incrementWatchCounts(dto.dramaIds ?? []);
  }

  @Post('search-select')
  @ApiOperation({ summary: 'Increment search select count for a drama by 1' })
  @ApiBody({ type: SearchSelectDto })
  @ApiResponse({ status: 200, description: 'Count incremented' })
  async searchSelect(@Body() dto: SearchSelectDto) {
    return this.exploreService.incrementSearchSelect(dto.dramaId);
  }

  @Post('search-recommendations')
  @ApiOperation({
    summary: 'Get personalized search recommendations, top searches, trending, and new releases',
    description: `Returns 4 arrays based on the user's preferred genres:\n\n` +
      `**1. searchRecommendations (max 10):** Personalized drama picks based on the sent genres (in priority order). ` +
      `3 out of 10 are guaranteed most-watched dramas, remaining 7 are random picks from matching genres.\n\n` +
      `**2. topSearch (20):** Dramas with the highest search-select count (searchSelectCount), ordered descending.\n\n` +
      `**3. topTrending (min 20):** Most watched dramas today (dailyWatchCount DESC). ` +
      `If fewer than 20 dramas have daily views, the remainder is filled from weekly watch counts.\n\n` +
      `**4. newRelease (20):** Latest dramas matching the sent genres, sorted by creation date. ` +
      `If genre-matched dramas are fewer than 20, the remainder is filled with the newest dramas regardless of genre.`,
  })
  @ApiBody({ type: SearchRecommendationRequestDto })
  @ApiResponse({ status: 200, description: 'Search recommendation data with 4 arrays' })
  async searchRecommendations(@Body() dto: SearchRecommendationRequestDto) {
    return this.exploreService.getSearchRecommendations(dto.genres ?? []);
  }

  @Post('genre-wise-data')
  @ApiOperation({ summary: 'Get 100 dramas for a specific genre (case-insensitive)' })
  @ApiBody({ type: GenreDataRequestDto })
  @ApiResponse({ status: 200, description: 'Array of 100 dramas sorted by watch count' })
  async byGenre(@Body() dto: GenreDataRequestDto) {
    return this.exploreService.getByGenre(dto.genre, dto.page ?? 1);
  }
}
