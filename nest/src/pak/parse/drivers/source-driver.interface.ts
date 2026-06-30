import { Drama } from '../../entities/drama.entity';
import { DramaSourceLink } from '../../entities/drama-source-link.entity';
import { VideoFormatEnum } from '../../entities/enums';

export interface DiscoveredDrama {
  sourceSlug: string;
  sourceUrl: string;
  title: string;
  posterUrl?: string | null;
}

export interface EpisodeLink {
  number: number;
  url: string;
  lastmod: Date | null;
}

export interface SourceFingerprint {
  latestModified: Date | null;
  episodeCount?: number;
}

export interface DriverImportResult {
  dramaSlug: string;
  episodesFound: number;
  imported: number;
  skipped: number;
  failed: number;
  failures: Array<{ episode: number; reason: string }>;
}

export interface ISourceDriver {
  readonly driverSlug: string;

  discoverDramas(): Promise<DiscoveredDrama[]>;

  getEpisodeLinks(sourceSlug: string, sourceUrl: string): Promise<EpisodeLink[]>;

  getFingerprint(sourceSlug: string, sourceUrl: string): Promise<SourceFingerprint | null>;

  importDrama(drama: Drama, sourceLink: DramaSourceLink): Promise<DriverImportResult>;

  extractVideos?(episodeUrl: string): Promise<Array<{ url: string; format: VideoFormatEnum }>>;
}
