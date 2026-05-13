import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../error/failure.dart';

typedef ApiResult<T> = Future<Either<Failure, T>>;

/// Wraps a Dio call and returns Right(data) on success, Left(Failure) on failure.
Future<Either<Failure, T>> handle<T>(Future<T> Function() fn) async {
  try {
    final result = await fn();
    return Right(result);
  } on DioException catch (e) {
    if (e.error is Failure) return Left(e.error as Failure);
    return Left(UnknownFailure(e.message ?? 'Network error'));
  } catch (e) {
    return Left(UnknownFailure(e.toString()));
  }
}

/// Unwraps {success, data} envelope.
T unwrap<T>(Response res) {
  final body = res.data;
  if (body is Map && body['success'] == true) {
    return body['data'] as T;
  }
  throw DioException(
    requestOptions: res.requestOptions,
    response: res,
    error: const UnknownFailure('Malformed API response'),
  );
}

/// Paginated envelope unwrap.
({List<T> items, int page, int limit, int total}) unwrapPaginated<T>(
  Response res,
  T Function(Map<String, dynamic>) fromJson,
) {
  final body = res.data;
  if (body is Map && body['success'] == true) {
    final data = (body['data'] as List).cast<Map<String, dynamic>>();
    final meta = (body['meta'] as Map?) ?? const {};
    return (
      items: data.map(fromJson).toList(),
      page: (meta['page'] as int?) ?? 1,
      limit: (meta['limit'] as int?) ?? data.length,
      total: (meta['total'] as int?) ?? data.length,
    );
  }
  throw DioException(
    requestOptions: res.requestOptions,
    response: res,
    error: const UnknownFailure('Malformed API response'),
  );
}
