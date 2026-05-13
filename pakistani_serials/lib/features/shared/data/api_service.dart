import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../core/network/api_result.dart';
import '../../../core/network/dio_client.dart';
import '../models/app_config_model.dart';
import '../models/content_model.dart';

@singleton
class ApiService {
  ApiService(this._client);
  final DioClient _client;

  Dio get _dio => _client.dio;

  // App config (splash)
  Future<AppConfigModel> getAppConfig() async {
    final res = await _dio.get('/config');
    return AppConfigModel.fromJson(res.data as Map<String, dynamic>);
  }

  // Home
  Future<List<HomeRailModel>> getHome() async {
    final res = await _dio.get('/home');
    final data = unwrap<Map<String, dynamic>>(res);
    return (data['rails'] as List)
        .map((e) => HomeRailModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // Dramas (was "content")
  Future<List<ContentModel>> listContent({
    String? query,
    String? genreSlug,
    String? contentType,
    String sort = 'newest',
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _dio.get('/dramas', queryParameters: {
      if (query != null) 'q': query,
      if (genreSlug != null) 'genre_slug': genreSlug,
      if (contentType != null) 'type': contentType,
      'sort': sort,
      'page': page,
      'limit': limit,
    });
    final body = unwrap<Map<String, dynamic>>(res);
    final data = (body['data'] as List).cast<Map<String, dynamic>>();
    return data.map(ContentModel.fromJson).toList();
  }

  Future<ContentModel> contentDetail(String slug) async {
    final res = await _dio.get('/dramas/$slug');
    return ContentModel.fromJson(unwrap<Map<String, dynamic>>(res));
  }

  Future<List<ContentModel>> related(String slug) async {
    final res = await _dio.get('/dramas/$slug/related');
    final data = unwrap<List<dynamic>>(res).cast<Map<String, dynamic>>();
    return data.map(ContentModel.fromJson).toList();
  }

  Future<List<SeasonModel>> seasons(String slug) async {
    final res = await _dio.get('/dramas/$slug/seasons');
    final data = unwrap<List<dynamic>>(res).cast<Map<String, dynamic>>();
    return data.map(SeasonModel.fromJson).toList();
  }

  Future<List<EpisodeModel>> episodes(String slug, int seasonNumber) async {
    final res = await _dio.get('/dramas/$slug/seasons/$seasonNumber/episodes');
    final data = unwrap<List<dynamic>>(res).cast<Map<String, dynamic>>();
    return data.map(EpisodeModel.fromJson).toList();
  }

  Future<EpisodeModel> episode(String id) async {
    final res = await _dio.get('/episodes/$id');
    return EpisodeModel.fromJson(unwrap<Map<String, dynamic>>(res));
  }

  Future<List<ResolvedServer>> resolveEpisode(String id) async {
    final res = await _dio.get('/episodes/$id/resolve');
    final data = unwrap<Map<String, dynamic>>(res);
    return (data['servers'] as List)
        .cast<Map<String, dynamic>>()
        .map(ResolvedServer.fromJson)
        .toList();
  }

  // Genres
  Future<List<GenreModel>> genres() async {
    final res = await _dio.get('/genres');
    final data = unwrap<List<dynamic>>(res).cast<Map<String, dynamic>>();
    return data.map(GenreModel.fromJson).toList();
  }

  // Search
  Future<({List<ContentModel> content, List<EpisodeModel> episodes})> search(
      String q) async {
    final res = await _dio.get('/search', queryParameters: {'q': q});
    final data = unwrap<Map<String, dynamic>>(res);
    final content = (data['dramas'] as List)
        .cast<Map<String, dynamic>>()
        .map(ContentModel.fromJson)
        .toList();
    final episodes = (data['episodes'] as List)
        .cast<Map<String, dynamic>>()
        .map(EpisodeModel.fromJson)
        .toList();
    return (content: content, episodes: episodes);
  }
}
