import 'package:equatable/equatable.dart';

/// Market session metadata — phase and holiday flag for an exchange session.
enum MarketSessionPhase { preMarket, regular, afterHours, closed }

class MarketSessionMetadata extends Equatable {
  const MarketSessionMetadata({
    required this.exchange,
    required this.sessionDate,
    required this.phase,
    required this.isHalfDay,
    required this.isHoliday,
  });

  final String exchange;
  final String sessionDate;
  final MarketSessionPhase phase;
  final bool isHalfDay;
  final bool isHoliday;

  MarketSessionMetadata copyWith({
    String? exchange,
    String? sessionDate,
    MarketSessionPhase? phase,
    bool? isHalfDay,
    bool? isHoliday,
  }) => MarketSessionMetadata(
    exchange: exchange ?? this.exchange,
    sessionDate: sessionDate ?? this.sessionDate,
    phase: phase ?? this.phase,
    isHalfDay: isHalfDay ?? this.isHalfDay,
    isHoliday: isHoliday ?? this.isHoliday,
  );

  @override
  List<Object?> get props => [
    exchange,
    sessionDate,
    phase,
    isHalfDay,
    isHoliday,
  ];
}
