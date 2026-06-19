import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../services/rating_service.dart';

enum RatingStatus { idle, submitting, done }

class RatingState extends Equatable {
  const RatingState({
    this.status = RatingStatus.idle,
    this.rating = 0,
    this.shouldShow = false,
    this.requestReview = false,
  });

  final RatingStatus status;
  final int rating;
  final bool shouldShow;
  final bool requestReview;

  bool get showTextField => rating > 0 && rating <= 3;

  @override
  List<Object?> get props => [status, rating, shouldShow, requestReview];
}

@injectable
class RatingCubit extends Cubit<RatingState> {
  RatingCubit(this._service) : super(const RatingState());

  final RatingService _service;

  void checkShouldShow() {
    emit(RatingState(shouldShow: _service.shouldShowRating));
  }

  void setRating(int rating) {
    emit(RatingState(
      status: state.status,
      rating: rating,
      shouldShow: state.shouldShow,
    ));
  }

  Future<void> submit({String? message}) async {
    if (state.rating == 0 || state.status == RatingStatus.submitting) return;

    emit(RatingState(
      status: RatingStatus.submitting,
      rating: state.rating,
      shouldShow: state.shouldShow,
    ));

    try {
      await _service.submitFeedback(
        rating: state.rating,
        message: state.rating <= 3 ? message : null,
      );

      if (state.rating > 3) {
        emit(RatingState(
          status: RatingStatus.done,
          rating: state.rating,
          shouldShow: state.shouldShow,
          requestReview: true,
        ));
        await _service.requestInAppReview();
        return;
      }
    } catch (_) {
      // Crash-protected
    }

    emit(RatingState(
      status: RatingStatus.done,
      rating: state.rating,
      shouldShow: state.shouldShow,
    ));
  }
}
