// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'content_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GenreModel _$GenreModelFromJson(Map<String, dynamic> json) => GenreModel(
  id: json['id'] as String,
  name: json['name'] as String,
  slug: json['slug'] as String,
  iconUrl: json['iconUrl'] as String?,
  displayOrder: (json['displayOrder'] as num?)?.toInt(),
);

Map<String, dynamic> _$GenreModelToJson(GenreModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'iconUrl': instance.iconUrl,
      'displayOrder': instance.displayOrder,
    };

ContentModel _$ContentModelFromJson(Map<String, dynamic> json) => ContentModel(
  id: json['id'] as String,
  title: json['title'] as String,
  slug: json['slug'] as String,
  synopsis: json['synopsis'] as String?,
  posterUrl: json['posterUrl'] as String?,
  backdropUrl: json['backdropUrl'] as String?,
  trailerUrl: json['trailerUrl'] as String?,
  contentType: json['type'] as String,
  status: json['status'] as String,
  releaseYear: (json['releaseYear'] as num?)?.toInt(),
  ratingAvg: json['ratingAvg'] as String,
  ratingCount: (json['ratingCount'] as num).toInt(),
  totalSeasons: (json['totalSeasons'] as num).toInt(),
  totalEpisodes: (json['totalEpisodes'] as num).toInt(),
  language: json['language'] as String,
  isFeatured: (json['isFeatured'] as num).toInt(),
  isPublished: (json['isPublished'] as num).toInt(),
  publishedAt:
      json['publishedAt'] == null
          ? null
          : DateTime.parse(json['publishedAt'] as String),
  genres:
      (json['genres'] as List<dynamic>?)
          ?.map((e) => GenreModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  lastEpisodeAt: json['lastEpisodeAt'] as String?,
  totalLikes: (json['totalLikes'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$ContentModelToJson(ContentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'slug': instance.slug,
      'synopsis': instance.synopsis,
      'posterUrl': instance.posterUrl,
      'backdropUrl': instance.backdropUrl,
      'trailerUrl': instance.trailerUrl,
      'type': instance.contentType,
      'status': instance.status,
      'releaseYear': instance.releaseYear,
      'ratingAvg': instance.ratingAvg,
      'ratingCount': instance.ratingCount,
      'totalSeasons': instance.totalSeasons,
      'totalEpisodes': instance.totalEpisodes,
      'language': instance.language,
      'isFeatured': instance.isFeatured,
      'isPublished': instance.isPublished,
      'publishedAt': instance.publishedAt?.toIso8601String(),
      'genres': instance.genres,
      'lastEpisodeAt': instance.lastEpisodeAt,
      'totalLikes': instance.totalLikes,
    };

SeasonModel _$SeasonModelFromJson(Map<String, dynamic> json) => SeasonModel(
  id: json['id'] as String,
  contentId: json['dramaId'] as String,
  seasonNumber: (json['number'] as num).toInt(),
  title: json['title'] as String?,
  synopsis: json['synopsis'] as String?,
  posterUrl: json['posterUrl'] as String?,
  totalEpisodes: (json['totalEpisodes'] as num?)?.toInt(),
);

Map<String, dynamic> _$SeasonModelToJson(SeasonModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'dramaId': instance.contentId,
      'number': instance.seasonNumber,
      'title': instance.title,
      'synopsis': instance.synopsis,
      'posterUrl': instance.posterUrl,
      'totalEpisodes': instance.totalEpisodes,
    };

EpisodeVideoModel _$EpisodeVideoModelFromJson(Map<String, dynamic> json) =>
    EpisodeVideoModel(
      id: json['id'] as String,
      label: json['label'] as String?,
      url: json['url'] as String,
      format: json['format'] as String,
      quality: json['quality'] as String,
      language: json['language'] as String,
      subtitleUrl: json['subtitleUrl'] as String?,
      priority: (json['priority'] as num).toInt(),
      isActive: (json['isActive'] as num).toInt(),
    );

Map<String, dynamic> _$EpisodeVideoModelToJson(EpisodeVideoModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'label': instance.label,
      'url': instance.url,
      'format': instance.format,
      'quality': instance.quality,
      'language': instance.language,
      'subtitleUrl': instance.subtitleUrl,
      'priority': instance.priority,
      'isActive': instance.isActive,
    };

EpisodeModel _$EpisodeModelFromJson(Map<String, dynamic> json) => EpisodeModel(
  id: json['id'] as String,
  contentId: json['dramaId'] as String,
  seasonId: json['seasonId'] as String,
  episodeNumber: (json['number'] as num).toInt(),
  title: json['title'] as String?,
  synopsis: json['synopsis'] as String?,
  durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 0,
  thumbnailUrl: json['thumbnailUrl'] as String?,
  airDate: json['airDate'] as String?,
  playUrl: json['playUrl'] as String?,
  videos:
      (json['videos'] as List<dynamic>?)
          ?.map((e) => EpisodeVideoModel.fromJson(e as Map<String, dynamic>))
          .toList(),
);

Map<String, dynamic> _$EpisodeModelToJson(EpisodeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'dramaId': instance.contentId,
      'seasonId': instance.seasonId,
      'number': instance.episodeNumber,
      'title': instance.title,
      'synopsis': instance.synopsis,
      'durationSeconds': instance.durationSeconds,
      'thumbnailUrl': instance.thumbnailUrl,
      'airDate': instance.airDate,
      'playUrl': instance.playUrl,
      'videos': instance.videos,
    };

HomeRailModel _$HomeRailModelFromJson(Map<String, dynamic> json) =>
    HomeRailModel(
      id: json['id'] as String,
      title: json['title'] as String,
      railType: json['railType'] as String,
      items:
          (json['items'] as List<dynamic>)
              .map((e) => ContentModel.fromJson(e as Map<String, dynamic>))
              .toList(),
    );

Map<String, dynamic> _$HomeRailModelToJson(HomeRailModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'railType': instance.railType,
      'items': instance.items,
    };
