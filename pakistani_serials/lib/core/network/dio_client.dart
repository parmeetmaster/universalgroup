import 'package:dio/dio.dart';
import 'package:dio_smart_retry/dio_smart_retry.dart';
import 'package:flutter/foundation.dart';
import 'package:injectable/injectable.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../config/env.dart';
import 'auth_interceptor.dart';
import 'error_interceptor.dart';

@singleton
class DioClient {
  DioClient(this._authInterceptor) {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: Env.httpConnectTimeout,
      receiveTimeout: Env.httpReceiveTimeout,
      contentType: Headers.jsonContentType,
    ));

    _dio.interceptors.addAll([
      _authInterceptor,
      RetryInterceptor(
        dio: _dio,
        retryableExtraStatuses: const {502, 503, 504},
      ),
      ErrorInterceptor(),
      // Dev-only HTTP log — every request + full response body in the
      // console. Tree-shaken out of release builds via kDebugMode.
      if (kDebugMode)
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          maxWidth: 120,
        ),
    ]);
  }

  late final Dio _dio;
  final AuthInterceptor _authInterceptor;

  Dio get dio => _dio;
}
