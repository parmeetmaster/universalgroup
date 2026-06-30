export enum DramaTypeEnum {
  DRAMA = 'drama',
  MOVIE = 'movie',
  TURKISH_DUB = 'turkish_dub',
  LIVE_TV = 'live_tv',
}

export enum DramaStatusEnum {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  UPCOMING = 'upcoming',
}

export enum VideoFormatEnum {
  HLS = 'hls',
  MP4 = 'mp4',
  DASH = 'dash',
  EMBED = 'embed',
}

export enum VideoQualityEnum {
  AUTO = 'auto',
  Q_360 = '360p',
  Q_480 = '480p',
  Q_720 = '720p',
  Q_1080 = '1080p',
  Q_4K = '4k',
}

export enum RailTypeEnum {
  HERO = 'hero',
  TRENDING = 'trending',
  NEW = 'new',
  TOP10 = 'top10',
  GENRE = 'genre',
  CUSTOM = 'custom',
}

export enum ParseRunStatusEnum {
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum MatchMethodEnum {
  MANUAL = 'manual',
  EXACT_SLUG = 'exact_slug',
  FUZZY_TITLE = 'fuzzy_title',
  SITEMAP_DISCOVERY = 'sitemap_discovery',
}

export enum SourceLinkStatusEnum {
  ACTIVE = 'active',
  BROKEN = 'broken',
  STALE = 'stale',
}
