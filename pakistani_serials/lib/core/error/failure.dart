import 'package:equatable/equatable.dart';

sealed class Failure extends Equatable {
  const Failure(this.message, {this.code});

  final String message;
  final String? code;

  @override
  List<Object?> get props => [message, code];
}

class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.code});
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'No internet connection']);
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure([super.message = 'Please sign in again'])
      : super(code: 'UNAUTHORIZED');
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message, {this.details}) : super(code: 'VALIDATION_ERROR');
  final List<Map<String, dynamic>>? details;

  @override
  List<Object?> get props => [message, code, details];
}

class NotFoundFailure extends Failure {
  const NotFoundFailure([super.message = 'Not found']) : super(code: 'NOT_FOUND');
}

class UnknownFailure extends Failure {
  const UnknownFailure([super.message = 'Something went wrong']);
}
