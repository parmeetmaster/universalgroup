export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  gradient: string;
}

export interface AnimeStats {
  totalEpisodes: number;
  registeredDevices: number;
  notificationsSent: number;
  activeCountries: number;
  blockedCountries: number;
  kvEntries: number;
  lastScrapeTime: string;
  scraperStatus: "running" | "idle" | "error";
}

export interface PakistaniStats {
  totalDramas: number;
  totalEpisodes: number;
  totalUsers: number;
  totalGenres: number;
  activeWatchlists: number;
  lastScrapeTime: string;
  scraperStatus: "running" | "idle" | "error";
}

export interface AviationStats {
  totalArticles: number;
  totalCategories: number;
  notificationsSent: number;
  youtubeShorts: number;
  activeSources: number;
  lastScrapeTime: string;
  scraperStatus: "running" | "idle" | "error";
}
