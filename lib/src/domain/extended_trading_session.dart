import 'package:equatable/equatable.dart';

/// Extended trading session — pre/after-hours session window config.
enum ExtendedSessionType { preMarket, afterHours, overnight }

class ExtendedTradingSession extends Equatable {
  const ExtendedTradingSession({
    required this.exchange,
    required this.sessionType,
    required this.openTime,
    required this.closeTime,
    required this.isActive,
  });

  final String exchange;
  final ExtendedSessionType sessionType;

  /// Open time in 'HH:mm' format.
  final String openTime;

  /// Close time in 'HH:mm' format.
  final String closeTime;
  final bool isActive;

  ExtendedTradingSession copyWith({
    String? exchange,
    ExtendedSessionType? sessionType,
    String? openTime,
    String? closeTime,
    bool? isActive,
  }) => ExtendedTradingSession(
    exchange: exchange ?? this.exchange,
    sessionType: sessionType ?? this.sessionType,
    openTime: openTime ?? this.openTime,
    closeTime: closeTime ?? this.closeTime,
    isActive: isActive ?? this.isActive,
  );

  @override
  List<Object?> get props => [
    exchange,
    sessionType,
    openTime,
    closeTime,
    isActive,
  ];
}
