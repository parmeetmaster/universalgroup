import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/notifications/notification_service.dart';
import '../../../../core/services/rating_service.dart';
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
    this.shouldShowRating = false,
  });

  final HomeStatus status;
  final List<HomeRailModel> rails;
  final String? errorMessage;
  final bool shouldShowRating;

  HomeState copyWith({
    HomeStatus? status,
    List<HomeRailModel>? rails,
    String? errorMessage,
    bool? shouldShowRating,
  }) =>
      HomeState(
        status: status ?? this.status,
        rails: rails ?? this.rails,
        errorMessage: errorMessage,
        shouldShowRating: shouldShowRating ?? this.shouldShowRating,
      );

  @override
  List<Object?> get props => [status, rails, errorMessage, shouldShowRating];
}

@injectable
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  HomeBloc(this._api, this._notificationService, this._ratingService)
      : super(const HomeState()) {
    on<HomeStarted>(_onStarted);
    on<HomeRefreshed>((e, emit) => _load(emit));
  }

  final ApiService _api;
  final NotificationService _notificationService;
  final RatingService _ratingService;

  Future<void> _onStarted(HomeStarted event, Emitter<HomeState> emit) async {
    _notificationService.init();
    _ratingService.incrementOpenCount();
    await _load(emit);
  }

  Future<void> _load(Emitter<HomeState> emit) async {
    emit(state.copyWith(status: HomeStatus.loading));
    try {
      final rails = await _api.getHome();
      emit(state.copyWith(
        status: HomeStatus.loaded,
        rails: rails,
        shouldShowRating: _ratingService.shouldShowRating,
      ));
    } catch (e) {
      emit(state.copyWith(status: HomeStatus.error, errorMessage: e.toString()));
    }
  }
}
