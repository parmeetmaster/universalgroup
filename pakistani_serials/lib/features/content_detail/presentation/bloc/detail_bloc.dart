import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../shared/data/api_service.dart';
import '../../../shared/models/content_model.dart';
import '../../../watchlist/presentation/bloc/watchlist_bloc.dart';

sealed class DetailEvent {}
class DetailLoad extends DetailEvent {
  final String slug;
  DetailLoad(this.slug);
}
class DetailSeasonChanged extends DetailEvent {
  final int seasonNumber;
  DetailSeasonChanged(this.seasonNumber);
}
class DetailWatchlistToggled extends DetailEvent {}

enum DetailStatus { initial, loading, loaded, error }

class DetailState extends Equatable {
  final DetailStatus status;
  final ContentModel? content;
  final List<SeasonModel> seasons;
  final List<EpisodeModel> episodes;
  final List<ContentModel> related;
  final int currentSeason;
  final bool inWatchlist;
  final String? errorMessage;

  const DetailState({
    this.status = DetailStatus.initial,
    this.content,
    this.seasons = const [],
    this.episodes = const [],
    this.related = const [],
    this.currentSeason = 1,
    this.inWatchlist = false,
    this.errorMessage,
  });

  DetailState copyWith({
    DetailStatus? status,
    ContentModel? content,
    List<SeasonModel>? seasons,
    List<EpisodeModel>? episodes,
    List<ContentModel>? related,
    int? currentSeason,
    bool? inWatchlist,
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
        errorMessage: errorMessage,
      );

  @override
  List<Object?> get props =>
      [status, content, seasons, episodes, related, currentSeason, inWatchlist, errorMessage];
}

@injectable
class DetailBloc extends Bloc<DetailEvent, DetailState> {
  DetailBloc(this._api, this._watchlist) : super(const DetailState()) {
    on<DetailLoad>(_onLoad);
    on<DetailSeasonChanged>(_onSeasonChanged);
    on<DetailWatchlistToggled>(_onWatchlistToggled);
  }

  final ApiService _api;
  final WatchlistBloc _watchlist;

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
      emit(state.copyWith(
        status: DetailStatus.loaded,
        content: content,
        seasons: seasons,
        episodes: episodes,
        related: related,
        currentSeason: first,
        inWatchlist: _watchlist.state.contains(content.slug),
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
}
