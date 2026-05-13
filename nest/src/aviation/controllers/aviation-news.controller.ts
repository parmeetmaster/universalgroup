import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AviationNewsService } from '../services/aviation-news.service';

@ApiTags('Aviation News')
@Controller('aviation-news')
export class AviationNewsController {
  constructor(private readonly newsService: AviationNewsService) {}

  @Get('home')
  @ApiOperation({ summary: 'Get homepage data', description: 'Returns hero article, featured cards, latest articles, sidebar and footer data' })
  @ApiResponse({ status: 200, description: 'Homepage data retrieved successfully' })
  getHome() {
    return this.newsService.getHome();
  }

  @Get('category/:slug')
  @ApiOperation({ summary: 'Get articles by category', description: 'Returns paginated articles for a specific category' })
  @ApiParam({ name: 'slug', description: 'Category slug (e.g. airline-news, airport-news, aerospace)', example: 'airline-news' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: '1' })
  @ApiResponse({ status: 200, description: 'Category articles retrieved successfully' })
  getCategory(
    @Param('slug') slug: string,
    @Query('page') page: string = '1',
  ) {
    return this.newsService.getCategory(slug, parseInt(page, 10) || 1);
  }

  @Get('article')
  @ApiOperation({ summary: 'Get full article details', description: 'Returns complete article content including author, tags, related posts' })
  @ApiQuery({ name: 'path', required: true, description: 'Article path/URL to scrape', example: '/british-airways-starlink-wifi-boeing-787/' })
  @ApiResponse({ status: 200, description: 'Article details retrieved successfully' })
  getArticle(@Query('path') path: string) {
    return this.newsService.getArticle(path);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search articles', description: 'Search for articles by keyword with pagination' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query string', example: 'boeing' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: '1' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  search(
    @Query('q') query: string,
    @Query('page') page: string = '1',
  ) {
    return this.newsService.search(query, parseInt(page, 10) || 1);
  }

  @Get('author/:slug')
  @ApiOperation({ summary: 'Get articles by author', description: 'Returns author info and their paginated articles' })
  @ApiParam({ name: 'slug', description: 'Author slug', example: 'helen-william' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: '1' })
  @ApiResponse({ status: 200, description: 'Author articles retrieved successfully' })
  getAuthor(
    @Param('slug') slug: string,
    @Query('page') page: string = '1',
  ) {
    return this.newsService.getAuthor(slug, parseInt(page, 10) || 1);
  }

  @Get('tag/:slug')
  @ApiOperation({ summary: 'Get articles by tag', description: 'Returns paginated articles for a specific tag' })
  @ApiParam({ name: 'slug', description: 'Tag slug', example: 'boeing' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: '1' })
  @ApiResponse({ status: 200, description: 'Tag articles retrieved successfully' })
  getTag(
    @Param('slug') slug: string,
    @Query('page') page: string = '1',
  ) {
    return this.newsService.getTag(slug, parseInt(page, 10) || 1);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Load more latest posts', description: 'Returns paginated latest posts via AJAX load-more. Use page=2,3,4... to load subsequent pages.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: '2' })
  @ApiResponse({ status: 200, description: 'Latest posts retrieved successfully' })
  getLatestPosts(@Query('page') page: string = '1') {
    return this.newsService.getLatestPosts(parseInt(page, 10) || 1);
  }
}
