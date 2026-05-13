import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Author {
  @ApiProperty({ example: 'Helen William' })
  name: string;

  @ApiProperty({ example: '/author/helen-william/' })
  url: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'Aviation journalist and editor' })
  bio?: string;
}

export class Category {
  @ApiProperty({ example: 'Airline News' })
  name: string;

  @ApiProperty({ example: '/category/airline-news/' })
  url: string;
}

export class ArticleBase {
  @ApiProperty({ example: 'British Airways New Starlink Wi-Fi Rollout' })
  title: string;

  @ApiProperty({ example: '/british-airways-starlink-wifi-boeing-787/' })
  url: string;
}

export class ArticleMinimal extends ArticleBase {
  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  image?: string;

  @ApiPropertyOptional({ example: 'March 19, 2026' })
  date?: string;

  @ApiPropertyOptional({ example: 'Helen William' })
  author?: string;
}

export class ArticleCard extends ArticleBase {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  image: string;

  @ApiProperty({ example: 'Airline News' })
  category: string;

  @ApiProperty({ example: 'March 19, 2026' })
  date: string;
}

export class ArticleSummary extends ArticleCard {
  @ApiProperty({ example: 'Helen William' })
  author: string;

  @ApiProperty({ example: 'British Airways has launched Starlink Wi-Fi on its first Boeing 787-8...' })
  excerpt: string;
}

export class ArticleDetail {
  @ApiProperty({ example: 'British Airways New Starlink Wi-Fi Rollout' })
  title: string;

  @ApiProperty({ example: '/british-airways-starlink-wifi-boeing-787/' })
  url: string;

  @ApiProperty({ type: Category })
  category: Category;

  @ApiProperty({ type: Author })
  author: Author;

  @ApiProperty({ example: 'March 19, 2026' })
  date: string;

  @ApiProperty({ example: '5 min read' })
  readTime: string;

  @ApiProperty({ example: { url: 'https://example.com/featured.jpg', caption: 'Boeing 787 with Starlink' } })
  featuredImage: {
    url: string;
    caption: string;
  };

  @ApiProperty({ example: '<p>Article HTML content...</p>' })
  content: string;

  @ApiProperty({ example: ['boeing', 'starlink', 'wifi'], type: [String] })
  tags: string[];

  @ApiProperty({ type: [ArticleSummary], description: 'Related posts from the same article page' })
  relatedPosts: ArticleSummary[];

  @ApiProperty({ example: { name: 'Aviation A2Z', url: 'https://aviationa2z.com', logo: 'https://cdn.aviationa2z.com/wp-content/uploads/2021/11/logo-226x100-1.png' }, description: 'Source website credit' })
  source: {
    name: string;
    url: string;
    logo: string;
  };
}
