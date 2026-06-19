import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../shared/data/api_service.dart';
import '../../../shared/models/content_model.dart';

enum SourcesStatus { initial, loading, loaded, error }

class SourcesState extends Equatable {
  const SourcesState({
    this.status = SourcesStatus.initial,
    this.servers = const [],
    this.errorMessage,
  });

  final SourcesStatus status;
  final List<ResolvedServer> servers;
  final String? errorMessage;

  @override
  List<Object?> get props => [status, servers, errorMessage];
}

@injectable
class SourcesCubit extends Cubit<SourcesState> {
  SourcesCubit(this._api) : super(const SourcesState());

  final ApiService _api;

  Future<void> resolve(String episodeId) async {
    emit(const SourcesState(status: SourcesStatus.loading));
    try {
      final servers = await _api.resolveEpisode(episodeId);
      emit(SourcesState(status: SourcesStatus.loaded, servers: servers));
    } catch (e) {
      emit(SourcesState(
        status: SourcesStatus.error,
        errorMessage: e.toString().replaceAll('Exception:', '').trim(),
      ));
    }
  }
}
