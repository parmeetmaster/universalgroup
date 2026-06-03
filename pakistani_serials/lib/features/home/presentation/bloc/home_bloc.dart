import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../shared/data/api_service.dart';
import '../../../shared/models/content_model.dart';

sealed class HomeEvent {}
class HomeStarted extends HomeEvent {}
class HomeRefreshed extends HomeEvent {}

enum HomeStatus { initial, loading, loaded, error }

class HomeState extends Equatable {
  const HomeState({
    this.status = HomeStatus.initial,
    this.rails = const [],
    this.errorMessage,
  });

  final HomeStatus status;
  final List<HomeRailModel> rails;
  final String? errorMessage;

  HomeState copyWith({
    HomeStatus? status,
    List<HomeRailModel>? rails,
    String? errorMessage,
  }) =>
      HomeState(
        status: status ?? this.status,
        rails: rails ?? this.rails,
        errorMessage: errorMessage,
      );

  @override
  List<Object?> get props => [status, rails, errorMessage];
}

@injectable
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  HomeBloc(this._api) : super(const HomeState()) {
    on<HomeStarted>((e, emit) => _load(emit));
    on<HomeRefreshed>((e, emit) => _load(emit));
  }

  final ApiService _api;

  Future<void> _load(Emitter<HomeState> emit) async {
    emit(state.copyWith(status: HomeStatus.loading));
    try {
      final rails = await _api.getHome();
      emit(state.copyWith(status: HomeStatus.loaded, rails: rails));
    } catch (e) {
      emit(state.copyWith(status: HomeStatus.error, errorMessage: e.toString()));
    }
  }
}
