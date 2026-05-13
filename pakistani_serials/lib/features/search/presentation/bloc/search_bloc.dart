import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../shared/data/api_service.dart';
import '../../../shared/models/content_model.dart';

sealed class SearchEvent {}
class SearchQueryChanged extends SearchEvent {
  final String query;
  SearchQueryChanged(this.query);
}

enum SearchStatus { idle, loading, loaded, error }

class SearchState extends Equatable {
  final SearchStatus status;
  final String query;
  final List<ContentModel> content;
  final List<EpisodeModel> episodes;
  final String? errorMessage;

  const SearchState({
    this.status = SearchStatus.idle,
    this.query = '',
    this.content = const [],
    this.episodes = const [],
    this.errorMessage,
  });

  SearchState copyWith({
    SearchStatus? status,
    String? query,
    List<ContentModel>? content,
    List<EpisodeModel>? episodes,
    String? errorMessage,
  }) =>
      SearchState(
        status: status ?? this.status,
        query: query ?? this.query,
        content: content ?? this.content,
        episodes: episodes ?? this.episodes,
        errorMessage: errorMessage,
      );

  @override
  List<Object?> get props => [status, query, content, episodes, errorMessage];
}

@injectable
class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc(this._api) : super(const SearchState()) {
    on<SearchQueryChanged>(_onChanged);
  }

  final ApiService _api;
  Timer? _debounce;

  Future<void> _onChanged(
      SearchQueryChanged e, Emitter<SearchState> emit) async {
    _debounce?.cancel();
    final q = e.query.trim();
    if (q.length < 2) {
      emit(const SearchState());
      return;
    }
    emit(state.copyWith(status: SearchStatus.loading, query: q));
    final completer = Completer<void>();
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      try {
        final r = await _api.search(q);
        if (!emit.isDone) {
          emit(state.copyWith(
            status: SearchStatus.loaded,
            content: r.content,
            episodes: r.episodes,
          ));
        }
      } catch (err) {
        if (!emit.isDone) {
          emit(state.copyWith(
              status: SearchStatus.error, errorMessage: err.toString()));
        }
      }
      completer.complete();
    });
    await completer.future;
  }

  @override
  Future<void> close() {
    _debounce?.cancel();
    return super.close();
  }
}
