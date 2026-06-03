import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/util/watch_history.dart';
import '../../../shared/data/api_service.dart';
import '../../../shared/models/content_model.dart';
import '../../../watchlist/presentation/bloc/watchlist_bloc.dart';


sealed class DetailEvent {}
class DetailLoad extends DetailEvent {
  DetailLoad(this.slug);
  final String slug;
}
class DetailSeasonChanged extends DetailEvent {
  DetailSeasonChanged(this.seasonNumber);
  final int seasonNumber;
}
class DetailWatchlistToggled extends DetailEvent {}
class DetailLikeToggled extends DetailEvent {}

enum DetailStatus { initial, loading, loaded, error }

class DetailState extends Equatable {
  const DetailState({
    this.status = DetailStatus.initial,
    this.content,
    this.seasons = const [],
    this.episodes = const [],
    this.related = const [],
    this.currentSeason = 1,
    this.inWatchlist = false,
    this.isLiked = false,
    this.totalLikes = 0,
    this.lastPlayed,
    this.errorMessage,
  });

  final DetailStatus status;
  final ContentModel? content;
  final List<SeasonModel> seasons;
  final List<EpisodeModel> episodes;
  final List<ContentModel> related;
  final int currentSeason;
  final bool inWatchlist;
  final bool isLiked;
  final int totalLikes;
  final LastPlayed? lastPlayed;
  final String? errorMessage;

  DetailState copyWith({
    DetailStatus? status,
    ContentModel? content,
    List<SeasonModel>? seasons,
    List<EpisodeModel>? episodes,
    List<ContentModel>? related,
    int? currentSeason,
    bool? inWatchlist,
    bool? isLiked,
    int? totalLikes,
    LastPlayed? lastPlayed,
    bool clearLastPlayed = false,
    String? errorMessage,
  }) =>
      DetailState(
        status: status ?? this.status,
        content: content ?? this.content,
        seasons: seasons ?? this.seasons,
        episodes: episodes ?? this.episodes,
        related: related ?? this.related,
        currentSeason: currentSeason ?? this.currentSeason,
        inWatchlist: inWatchlist ?? this.inWatchlist,
        isLiked: isLiked ?? this.isLiked,
        totalLikes: totalLikes ?? this.totalLikes,
        lastPlayed: clearLastPlayed ? null : (lastPlayed ?? this.lastPlayed),
        errorMessage: errorMessage,
      );

  @override
  List<Object?> get props =>
      [status, content, seasons, episodes, related, currentSeason, inWatchlist, isLiked, totalLikes, lastPlayed, errorMessage];
}

const _deviceIdKey = 'pak_device_id';
const _likedKey = 'pak_liked_slugs';

@injectable
class DetailBloc extends Bloc<DetailEvent, DetailState> {
  DetailBloc(this._api, this._watchlist, this._watchHistory) : super(const DetailState()) {
    on<DetailLoad>(_onLoad);
    on<DetailSeasonChanged>(_onSeasonChanged);
    on<DetailWatchlistToggled>(_onWatchlistToggled);
    on<DetailLikeToggled>(_onLikeToggled);
  }

  final ApiService _api;
  final WatchlistBloc _watchlist;
  final WatchHistoryService _watchHistory;

  static Future<String> _getDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString(_deviceIdKey);
    if (id == null) {
      id = const Uuid().v4();
      await prefs.setString(_deviceIdKey, id);
    }
    return id;
  }

  static Future<Set<String>> _getLocalLikedSlugs() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_likedKey)?.toSet() ?? {};
  }

  static Future<void> _setLocalLikedSlugs(Set<String> slugs) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_likedKey, slugs.toList());
  }

  Future<void> _onLoad(DetailLoad e, Emitter<DetailState> emit) async {
    emit(state.copyWith(status: DetailStatus.loading));
    try {
      final content = await _api.contentDetail(e.slug);
      final seasons = await _safe(() => _api.seasons(e.slug), const <SeasonModel>[]);
      final first = seasons.isNotEmpty ? seasons.first.seasonNumber : 1;
      final episodes = seasons.isEmpty
          ? const <EpisodeModel>[]
          : await _safe(
              () => _api.episodes(e.slug, first), const <EpisodeModel>[]);
      final related = await _safe(() => _api.related(e.slug), const <ContentModel>[]);

      // Check like status from local cache
      final likedSlugs = await _getLocalLikedSlugs();
      final isLiked = likedSlugs.contains(e.slug);

      // Load last played episode for this drama
      final lp = _watchHistory.getLastPlayed(e.slug);

      // Record view
      _api.recordView(e.slug).catchError((_) {});

      emit(state.copyWith(
        status: DetailStatus.loaded,
        content: content,
        seasons: seasons,
        episodes: episodes,
        related: related,
        currentSeason: first,
        inWatchlist: _watchlist.state.contains(content.slug),
        isLiked: isLiked,
        totalLikes: content.totalLikes,
        lastPlayed: lp,
      ));
    } catch (err) {
      emit(state.copyWith(status: DetailStatus.error, errorMessage: err.toString()));
    }
  }

  Future<T> _safe<T>(Future<T> Function() f, T fallback) async {
    try {
      return await f();
    } catch (_) {
      return fallback;
    }
  }

  Future<void> _onSeasonChanged(
      DetailSeasonChanged e, Emitter<DetailState> emit) async {
    final slug = state.content?.slug;
    if (slug == null) return;
    try {
      final episodes = await _api.episodes(slug, e.seasonNumber);
      emit(state.copyWith(currentSeason: e.seasonNumber, episodes: episodes));
    } catch (_) {}
  }

  Future<void> _onWatchlistToggled(
      DetailWatchlistToggled e, Emitter<DetailState> emit) async {
    final content = state.content;
    if (content == null) return;
    _watchlist.add(WatchlistToggled(content));
    emit(state.copyWith(inWatchlist: !state.inWatchlist));
  }

  Future<void> _onLikeToggled(
      DetailLikeToggled e, Emitter<DetailState> emit) async {
    final slug = state.content?.slug;
    if (slug == null) return;

    // Optimistic update
    final wasLiked = state.isLiked;
    final newLikes = wasLiked
        ? (state.totalLikes - 1).clamp(0, 999999999)
        : state.totalLikes + 1;
    emit(state.copyWith(isLiked: !wasLiked, totalLikes: newLikes));

    // Update local cache
    final likedSlugs = await _getLocalLikedSlugs();
    if (wasLiked) {
      likedSlugs.remove(slug);
    } else {
      likedSlugs.add(slug);
    }
    await _setLocalLikedSlugs(likedSlugs);

    // Call API
    try {
      final deviceId = await _getDeviceId();
      final result = await _api.toggleLike(slug, deviceId);
      emit(state.copyWith(
        isLiked: result['liked'] as bool,
        totalLikes: result['totalLikes'] as int,
      ));
    } catch (_) {
      // Revert on failure
      emit(state.copyWith(isLiked: wasLiked, totalLikes: state.totalLikes));
    }
  }
}
