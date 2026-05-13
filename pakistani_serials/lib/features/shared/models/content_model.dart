import 'package:json_annotation/json_annotation.dart';

part 'content_model.g.dart';

@JsonSerializable()
class GenreModel {
  final String id;
  final String name;
  final String slug;
  final String? iconUrl;
  final int? displayOrder;

  const GenreModel({
    required this.id,
    required this.name,
    required this.slug,
    this.iconUrl,
    this.displayOrder,
  });

  factory GenreModel.fromJson(Map<String, dynamic> json) => _$GenreModelFromJson(json);
  Map<String, dynamic> toJson() => _$GenreModelToJson(this);
}

@JsonSerializable()
class ContentModel {
  final String id;
  final String title;
  final String slug;
  final String? synopsis;
  final String? posterUrl;
  final String? backdropUrl;
  final String? trailerUrl;
  @JsonKey(name: 'type')
  final String contentType;
  final String status;
  final int? releaseYear;
  final String ratingAvg;
  final int ratingCount;
  final int totalSeasons;
  final int totalEpisodes;
  final String language;
  final int isFeatured;
  final int isPublished;
  final DateTime? publishedAt;
  final List<GenreModel>? genres;
  final String? lastEpisodeAt;

  const ContentModel({
    required this.id,
    required this.title,
    required this.slug,
    this.synopsis,
    this.posterUrl,
    this.backdropUrl,
    this.trailerUrl,
    required this.contentType,
    required this.status,
    this.releaseYear,
    required this.ratingAvg,
    required this.ratingCount,
    required this.totalSeasons,
    required this.totalEpisodes,
    required this.language,
    required this.isFeatured,
    required this.isPublished,
    this.publishedAt,
    this.genres,
    this.lastEpisodeAt,
  });

  double get ratingAvgNumeric => double.tryParse(ratingAvg) ?? 0;

  factory ContentModel.fromJson(Map<String, dynamic> json) => _$ContentModelFromJson(json);
  Map<String, dynamic> toJson() => _$ContentModelToJson(this);
}

@JsonSerializable()
class SeasonModel {
  final String id;
  @JsonKey(name: 'dramaId')
  final String contentId;
  @JsonKey(name: 'number')
  final int seasonNumber;
  final String? title;
  final String? synopsis;
  final String? posterUrl;
  final int? totalEpisodes;

  const SeasonModel({
    required this.id,
    required this.contentId,
    required this.seasonNumber,
    this.title,
    this.synopsis,
    this.posterUrl,
    this.totalEpisodes,
  });

  factory SeasonModel.fromJson(Map<String, dynamic> json) => _$SeasonModelFromJson(json);
  Map<String, dynamic> toJson() => _$SeasonModelToJson(this);
}

@JsonSerializable()
class EpisodeVideoModel {
  final String id;
  final String? label;
  final String url;
  final String format;
  final String quality;
  final String language;
  final String? subtitleUrl;
  final int priority;
  final int isActive;

  const EpisodeVideoModel({
    required this.id,
    this.label,
    required this.url,
    required this.format,
    required this.quality,
    required this.language,
    this.subtitleUrl,
    required this.priority,
    required this.isActive,
  });

  factory EpisodeVideoModel.fromJson(Map<String, dynamic> json) =>
      _$EpisodeVideoModelFromJson(json);
  Map<String, dynamic> toJson() => _$EpisodeVideoModelToJson(this);
}

@JsonSerializable()
class EpisodeModel {
  final String id;
  @JsonKey(name: 'dramaId')
  final String contentId;
  final String seasonId;
  @JsonKey(name: 'number')
  final int episodeNumber;
  final String? title;
  final String? synopsis;
  final int durationSeconds;
  final String? thumbnailUrl;
  final String? airDate;
  final String? playUrl;
  final List<EpisodeVideoModel>? videos;

  const EpisodeModel({
    required this.id,
    required this.contentId,
    required this.seasonId,
    required this.episodeNumber,
    this.title,
    this.synopsis,
    required this.durationSeconds,
    this.thumbnailUrl,
    this.airDate,
    this.playUrl,
    this.videos,
  });

  String? get videoUrl => playUrl ?? videos?.firstOrNull?.url;

  factory EpisodeModel.fromJson(Map<String, dynamic> json) => _$EpisodeModelFromJson(json);
  Map<String, dynamic> toJson() => _$EpisodeModelToJson(this);
}

class ResolvedServer {
  final String label;
  final String url;
  final String format;

  const ResolvedServer({
    required this.label,
    required this.url,
    required this.format,
  });

  factory ResolvedServer.fromJson(Map<String, dynamic> json) => ResolvedServer(
        label: json['label'] as String? ?? 'Server',
        url: json['url'] as String,
        format: json['format'] as String? ?? 'embed',
      );
}

@JsonSerializable()
class HomeRailModel {
  final String id;
  final String title;
  final String railType;
  final List<ContentModel> items;

  const HomeRailModel({
    required this.id,
    required this.title,
    required this.railType,
    required this.items,
  });

  factory HomeRailModel.fromJson(Map<String, dynamic> json) => _$HomeRailModelFromJson(json);
  Map<String, dynamic> toJson() => _$HomeRailModelToJson(this);
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
