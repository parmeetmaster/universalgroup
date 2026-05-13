import 'package:dio/dio.dart';
import '../error/failure.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final failure = _toFailure(err);
    handler.reject(DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: failure,
      message: failure.message,
    ));
  }

  Failure _toFailure(DioException err) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.connectionError) {
      return const NetworkFailure();
    }
    final data = err.response?.data;
    if (data is Map && data['error'] is Map) {
      final e = data['error'] as Map;
      final code = e['code']?.toString();
      final msg = e['message']?.toString() ?? 'Server error';
      switch (code) {
        case 'UNAUTHORIZED':
          return UnauthorizedFailure(msg);
        case 'NOT_FOUND':
          return NotFoundFailure(msg);
        case 'VALIDATION_ERROR':
          return ValidationFailure(
            msg,
            details: (e['details'] as List?)?.cast<Map<String, dynamic>>(),
          );
        default:
          return ServerFailure(msg, code: code);
      }
    }
    return UnknownFailure(err.message ?? 'Something went wrong');
  }
}
