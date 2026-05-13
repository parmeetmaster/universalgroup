import 'package:equatable/equatable.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../shared/models/content_model.dart';

sealed class WatchlistEvent {}

class WatchlistToggled extends WatchlistEvent {
  final ContentModel content;
  WatchlistToggled(this.content);
}

class WatchlistCleared extends WatchlistEvent {}

class WatchlistState extends Equatable {
  final List<ContentModel> items;
  const WatchlistState({this.items = const []});

  bool contains(String slug) => items.any((c) => c.slug == slug);

  WatchlistState copyWith({List<ContentModel>? items}) =>
      WatchlistState(items: items ?? this.items);

  @override
  List<Object?> get props => [items];
}

@singleton
class WatchlistBloc extends HydratedBloc<WatchlistEvent, WatchlistState> {
  WatchlistBloc() : super(const WatchlistState()) {
    on<WatchlistToggled>((e, emit) {
      final exists = state.contains(e.content.slug);
      final next = exists
          ? state.items.where((c) => c.slug != e.content.slug).toList()
          : [e.content, ...state.items];
      emit(state.copyWith(items: next));
    });
    on<WatchlistCleared>((_, emit) => emit(const WatchlistState()));
  }

  @override
  WatchlistState? fromJson(Map<String, dynamic> json) {
    final list = (json['items'] as List?) ?? const [];
    return WatchlistState(
      items: list
          .cast<Map<String, dynamic>>()
          .map(ContentModel.fromJson)
          .toList(),
    );
  }

  @override
  Map<String, dynamic>? toJson(WatchlistState state) => {
        'items': state.items.map((c) => c.toJson()).toList(),
      };
}
