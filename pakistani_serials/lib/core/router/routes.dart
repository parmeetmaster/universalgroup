class AppRoutes {
  const AppRoutes._();

  static const splash = '/';
  static const auth = '/auth';

  static const shell = '/shell';
  static const home = '/home';
  static const browse = '/browse';
  static const search = '/search';
  static const watchlist = '/watchlist';
  static const profile = '/profile';

  static const detail = '/content/:slug';
  static const sources = '/sources';
  static const player = '/player';
  static const settings = '/settings';

  static String detailPath(String slug) => '/content/$slug';
}
