/// Resolves image URLs from the v2 API.
///
/// v2 endpoints return relative proxy URLs like `/api/pakistani-serials/img/ABC`.
/// This helper prepends the base domain so they become absolute URLs loadable
/// by CachedNetworkImage.
///
/// Absolute URLs (http/https) pass through unchanged.
/// Returns null for null or empty input.
/// Formats a count for display: 999 → "999", 1200 → "1.2K", 15300 → "15.3K", 1500000 → "1.5M"
String formatCount(int count) {
  if (count < 1000) return count.toString();
  if (count < 1000000) {
    final k = count / 1000;
    return k == k.truncateToDouble()
        ? '${k.toInt()}K'
        : '${k.toStringAsFixed(1)}K';
  }
  final m = count / 1000000;
  return m == m.truncateToDouble()
      ? '${m.toInt()}M'
      : '${m.toStringAsFixed(1)}M';
}

String? resolveImageUrl(String? url) {
  if (url == null || url.isEmpty) return null;
  if (url.startsWith('http')) return url;
  const baseDomain = 'https://global.animekill.com';
  return '$baseDomain$url';
}
