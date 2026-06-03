export function toProxyUrl(imagebanId: string | null | undefined, fallbackUrl?: string | null): string | null {
  if (imagebanId) return `/api/pakistani-serials/img/${imagebanId}`;
  return fallbackUrl || null;
}

export function transformDramaImages(drama: any): any {
  if (!drama) return drama;
  const result = { ...drama };
  result.posterUrl = toProxyUrl(drama.posterImagebanId, drama.posterUrl);
  result.backdropUrl = toProxyUrl(drama.backdropImagebanId, drama.backdropUrl);
  delete result.posterOriginalUrl;
  delete result.backdropOriginalUrl;
  delete result.posterImagebanId;
  delete result.backdropImagebanId;
  delete result.posterHosted;
  delete result.backdropHosted;
  delete result.sourceUrl;
  delete result.parseLastModified;
  delete result.parseLastAttemptedAt;
  delete result.parseLastSucceededAt;
  delete result.parseFailureCount;
  delete result.parseFrozenUntil;
  delete result.dailyViews;
  delete result.monthlyViews;
  return result;
}

export function transformEpisodeImages(episode: any, drama?: any): any {
  if (!episode) return episode;
  const result = { ...episode };
  result.thumbnailUrl = toProxyUrl(episode.thumbnailImagebanId, episode.thumbnailUrl)
    || toProxyUrl(drama?.posterImagebanId, drama?.posterUrl)
    || null;
  delete result.thumbnailOriginalUrl;
  delete result.thumbnailImagebanId;
  delete result.thumbnailHosted;
  delete result.notificationSent;
  delete result.isPlaceholder;
  delete result.sourceUrl;
  return result;
}
