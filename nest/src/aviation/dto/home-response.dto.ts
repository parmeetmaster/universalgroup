import { ApiProperty } from '@nestjs/swagger';
import {
  ArticleCard,
  ArticleMinimal,
  ArticleSummary,
} from './article.model';

export class SidebarDto {
  @ApiProperty({ type: [ArticleMinimal], description: 'Latest news sidebar items' })
  latestNews: ArticleMinimal[];

  @ApiProperty({ type: [ArticleMinimal], description: 'Featured sidebar items' })
  featured: ArticleMinimal[];

  @ApiProperty({ type: [ArticleSummary], description: "Editor's Choice articles — 5 items" })
  editorsChoice: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Aerospace section — 4 items' })
  aerospace: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Airlines section — 4 items' })
  airlines: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Airport section — 4 items' })
  airport: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Exclusive Blogs — 3 items' })
  exclusiveBlogs: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Editors Picks — 5 items' })
  editorsPicks: ArticleSummary[];
}

export class QuickLink {
  @ApiProperty({ example: 'About Us' })
  label: string;

  @ApiProperty({ example: '/about/' })
  url: string;
}

export class SocialLinks {
  @ApiProperty({ example: 'https://facebook.com/aviationa2z' })
  facebook: string;

  @ApiProperty({ example: 'https://twitter.com/aviationa2z' })
  twitter: string;

  @ApiProperty({ example: 'https://instagram.com/aviationa2z' })
  instagram: string;

  @ApiProperty({ example: 'https://linkedin.com/company/aviationa2z' })
  linkedin: string;
}

export class FooterDto {
  @ApiProperty({ type: [ArticleMinimal] })
  latestPosts: ArticleMinimal[];

  @ApiProperty({ type: [QuickLink] })
  quickLinks: { label: string; url: string }[];

  @ApiProperty({ type: SocialLinks })
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
}

export class HeroArticle extends ArticleCard {
  @ApiProperty({ example: 'Helen William' })
  author: string;
}

export class HomeResponseDto {
  @ApiProperty({ type: HeroArticle, description: 'Main hero overlay article' })
  hero: ArticleCard & { author: string };

  @ApiProperty({ type: [ArticleSummary], description: 'Top grid — ~10 trending articles (dark section)' })
  trendingArticles: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Latest News grid — 6 items' })
  latestNews: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Featured highlights — 6 items' })
  featured: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: "Editor's Choice grid — 5 items" })
  editorsChoice: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Aerospace section — 4 items' })
  aerospace: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Airlines section — 4 items' })
  airlines: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Airport section — 4 items' })
  airport: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Exclusive Blogs — 3 items' })
  exclusiveBlogs: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Popular Blogs grid — 4 items' })
  popularBlogs: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Editors Picks — 5 items' })
  editorsPicks: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Latest Posts list with excerpts — 5 items' })
  latestArticles: ArticleSummary[];

  @ApiProperty({ type: [ArticleSummary], description: 'Recent small posts — 3 items' })
  recentPosts: ArticleSummary[];

  @ApiProperty({ type: SidebarDto })
  sidebar: SidebarDto;

  @ApiProperty({ type: FooterDto })
  footer: FooterDto;
}
