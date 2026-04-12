import 'package:equatable/equatable.dart';

/// Describes an async data-loading state for a single piece of remote data.
///
/// Generic over the data type [T], used in providers and UI state classes
/// to represent loading, loaded, and error states without introducing
/// Flutter dependencies into the domain layer.
class AsyncDataState<T> extends Equatable {
  /// Creates an [AsyncDataState].
  const AsyncDataState({
    this.data,
    this.isLoading = false,
    this.errorMessage,
    this.lastUpdatedAt,
  });

  /// The loaded data value (`null` when not yet loaded or on error).
  final T? data;

  /// Whether a fetch is currently in progress.
  final bool isLoading;

  /// Error message from the most recent failed fetch (`null` when healthy).
  final String? errorMessage;

  /// Timestamp of the most recent successful load.
  final DateTime? lastUpdatedAt;

  /// Returns `true` when [data] is available.
  bool get hasData => data != null;

  /// Returns `true` when an error is present.
  bool get hasError => errorMessage != null;

  /// Returns `true` when data has never been loaded.
  bool get isEmpty => !hasData && !isLoading && !hasError;

  @override
  List<Object?> get props => [data, isLoading, errorMessage, lastUpdatedAt];
}
