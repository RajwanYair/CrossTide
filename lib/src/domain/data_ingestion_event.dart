import 'package:equatable/equatable.dart';

/// A single data ingestion event capturing what was fetched, from
/// which provider, and whether it succeeded.
class DataIngestionEvent extends Equatable {
  const DataIngestionEvent({
    required this.eventId,
    required this.ticker,
    required this.providerName,
    required this.recordsFetched,
    required this.succeeded,
    required this.durationMs,
    required this.occurredAt,
    this.errorMessage,
  });

  final String eventId;
  final String ticker;
  final String providerName;
  final int recordsFetched;
  final bool succeeded;

  /// Time taken for the ingestion call in milliseconds.
  final int durationMs;

  final DateTime occurredAt;
  final String? errorMessage;

  DataIngestionEvent copyWith({
    String? eventId,
    String? ticker,
    String? providerName,
    int? recordsFetched,
    bool? succeeded,
    int? durationMs,
    DateTime? occurredAt,
    String? errorMessage,
  }) => DataIngestionEvent(
    eventId: eventId ?? this.eventId,
    ticker: ticker ?? this.ticker,
    providerName: providerName ?? this.providerName,
    recordsFetched: recordsFetched ?? this.recordsFetched,
    succeeded: succeeded ?? this.succeeded,
    durationMs: durationMs ?? this.durationMs,
    occurredAt: occurredAt ?? this.occurredAt,
    errorMessage: errorMessage ?? this.errorMessage,
  );

  @override
  List<Object?> get props => [
    eventId,
    ticker,
    providerName,
    recordsFetched,
    succeeded,
    durationMs,
    occurredAt,
    errorMessage,
  ];
}
