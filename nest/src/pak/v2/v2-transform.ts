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
  delete result.weekViews;
  delete result.monthlyViews;
  delete result.allTimeViews;
  return result;
}

export function transformEpisodeImages(episode: any, drama?: any): any {
  if (!episode) return episode;
  const result = { ...episode };
  // Use drama poster as episode thumbnail
  result.thumbnailUrl = toProxyUrl(drama?.posterImagebanId, drama?.posterUrl) || null;
  result.durationSeconds = result.durationSeconds ?? 0;
  delete result.notificationSent;
  delete result.isPlaceholder;
  delete result.sourceUrl;
  return result;
}
