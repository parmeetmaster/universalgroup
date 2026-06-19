import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../shared/data/api_service.dart';
import '../shared/models/content_model.dart';

enum SeeAllStatus { initial, loading, loaded, error }

class SeeAllState extends Equatable {
  const SeeAllState({
    this.status = SeeAllStatus.initial,
    this.items = const [],
    this.page = 1,
    this.total = 0,
    this.activeGenre,
    this.error,
    this.loadingMore = false,
  });

  final SeeAllStatus status;
  final List<ContentModel> items;
  final int page;
  final int total;
  final String? activeGenre;
  final String? error;
  final bool loadingMore;

  bool get hasMore => items.length < total;

  SeeAllState copyWith({
    SeeAllStatus? status,
    List<ContentModel>? items,
    int? page,
    int? total,
    String? Function()? activeGenre,
    String? Function()? error,
    bool? loadingMore,
  }) =>
      SeeAllState(
        status: status ?? this.status,
        items: items ?? this.items,
        page: page ?? this.page,
        total: total ?? this.total,
        activeGenre: activeGenre != null ? activeGenre() : this.activeGenre,
        error: error != null ? error() : this.error,
        loadingMore: loadingMore ?? this.loadingMore,
      );

  @override
  List<Object?> get props =>
      [status, items, page, total, activeGenre, error, loadingMore];
}

@injectable
class SeeAllCubit extends Cubit<SeeAllState> {
  SeeAllCubit(this._api) : super(const SeeAllState());
  final ApiService _api;

  late String _railId;

  void init(String railId) {
    _railId = railId;
    _loadPage();
  }

  void selectGenre(String? slug) {
    if (slug == state.activeGenre) return;
    emit(SeeAllState(activeGenre: slug));
    _loadPage();
  }

  void loadMore() {
    if (state.loadingMore || !state.hasMore) return;
    _loadPage(isMore: true);
  }

  void retry() {
    emit(state.copyWith(status: SeeAllStatus.initial));
    _loadPage();
  }

  Future<void> _loadPage({bool isMore = false}) async {
    if (isMore) {
      emit(state.copyWith(loadingMore: true));
    } else if (state.status != SeeAllStatus.loaded) {
      emit(state.copyWith(status: SeeAllStatus.loading, error: () => null));
    }

    try {
      final result = await _api.railDramas(
        _railId,
        genre: state.activeGenre,
        page: state.page,
      );
      if (isClosed) return;
      emit(state.copyWith(
        items: [...state.items, ...result.items],
        total: result.total,
        page: state.page + 1,
        status: SeeAllStatus.loaded,
        loadingMore: false,
      ));
    } catch (e) {
      if (isClosed) return;
      emit(state.copyWith(
        status: state.items.isEmpty ? SeeAllStatus.error : SeeAllStatus.loaded,
        error: e.toString,
        loadingMore: false,
      ));
    }
  }
}
