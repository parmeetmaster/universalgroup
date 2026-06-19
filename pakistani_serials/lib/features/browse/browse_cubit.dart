import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../shared/data/api_service.dart';
import '../shared/models/content_model.dart';

enum BrowseStatus { loading, loaded, error }

class BrowseState extends Equatable {
  const BrowseState({
    this.status = BrowseStatus.loading,
    this.genres = const [],
    this.dramas = const [],
    this.activeGenre,
    this.error,
  });

  final BrowseStatus status;
  final List<GenreModel> genres;
  final List<ContentModel> dramas;
  final String? activeGenre;
  final String? error;

  BrowseState copyWith({
    BrowseStatus? status,
    List<GenreModel>? genres,
    List<ContentModel>? dramas,
    String? Function()? activeGenre,
    String? Function()? error,
  }) =>
      BrowseState(
        status: status ?? this.status,
        genres: genres ?? this.genres,
        dramas: dramas ?? this.dramas,
        activeGenre: activeGenre != null ? activeGenre() : this.activeGenre,
        error: error != null ? error() : this.error,
      );

  @override
  List<Object?> get props => [status, genres, dramas, activeGenre, error];
}

@injectable
class BrowseCubit extends Cubit<BrowseState> {
  BrowseCubit(this._api) : super(const BrowseState());
  final ApiService _api;

  Future<void> init({String? initialGenre}) async {
    emit(state.copyWith(
      activeGenre: () => initialGenre,
      status: BrowseStatus.loading,
    ));
    try {
      final genres = await _api.genres();
      if (isClosed) return;
      emit(state.copyWith(genres: genres));
    } catch (_) {}
    await _loadDramas();
  }

  Future<void> selectGenre(String? slug) async {
    if (slug == state.activeGenre) return;
    emit(state.copyWith(
      activeGenre: () => slug,
      status: BrowseStatus.loading,
    ));
    await _loadDramas();
  }

  Future<void> retry() => _loadDramas();

  Future<void> _loadDramas() async {
    emit(state.copyWith(status: BrowseStatus.loading, error: () => null));
    try {
      final dramas = await _api.listContent(
        genreSlug: state.activeGenre,
        limit: 50,
      );
      if (isClosed) return;
      emit(state.copyWith(
        dramas: dramas,
        status: BrowseStatus.loaded,
      ));
    } catch (e) {
      if (isClosed) return;
      emit(state.copyWith(
        status: BrowseStatus.error,
        error: e.toString,
      ));
    }
  }
}
