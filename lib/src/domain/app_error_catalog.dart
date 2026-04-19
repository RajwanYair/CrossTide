import 'package:equatable/equatable.dart';

/// App error catalog — typed error classification with retry semantics.
enum AppErrorSeverity { info, warning, error, critical, fatal }

class AppErrorCatalog extends Equatable {
  const AppErrorCatalog({
    required this.errorCode,
    required this.message,
    required this.severity,
    required this.isRetryable,
    required this.category,
  });

  final String errorCode;
  final String message;
  final AppErrorSeverity severity;
  final bool isRetryable;
  final String category;

  AppErrorCatalog copyWith({
    String? errorCode,
    String? message,
    AppErrorSeverity? severity,
    bool? isRetryable,
    String? category,
  }) => AppErrorCatalog(
    errorCode: errorCode ?? this.errorCode,
    message: message ?? this.message,
    severity: severity ?? this.severity,
    isRetryable: isRetryable ?? this.isRetryable,
    category: category ?? this.category,
  );

  @override
  List<Object?> get props => [
    errorCode,
    message,
    severity,
    isRetryable,
    category,
  ];
}
