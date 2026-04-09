/// Email Digest Config — per-user configuration for daily/weekly email digests.
library;

import 'package:equatable/equatable.dart';

/// How often email digests are generated.
enum DigestFrequency {
  /// One email per day (end of trading session).
  daily,

  /// One email per week (Friday close).
  weekly,

  /// Only when at least one consensus signal fired during the period.
  onSignalOnly,
}

/// Which content sections to include in the digest.
enum DigestSection {
  /// Summary of watchlist tickers and their current SMA status.
  watchlistSummary,

  /// Any BUY/SELL consensus signals fired during the period.
  consensusSignals,

  /// Net portfolio P&L if positions are configured.
  portfolioPnl,

  /// Upcoming earnings within the next 5 trading days.
  earningsCalendar,

  /// Dividend payments received or expected.
  dividendCalendar,
}

/// User configuration for email digest delivery.
class EmailDigestConfig extends Equatable {
  const EmailDigestConfig({
    required this.recipientEmail,
    required this.frequency,
    required this.sections,
    this.sendAtHour = 18,
    this.enabled = true,
  }) : assert(
            sendAtHour >= 0 && sendAtHour <= 23,
            'sendAtHour must be 0–23');

  /// Recipient email address.
  final String recipientEmail;

  /// How often to send.
  final DigestFrequency frequency;

  /// Which content blocks to include.
  final List<DigestSection> sections;

  /// Local hour (0–23) at which the digest is scheduled.
  final int sendAtHour;

  /// Whether digest sending is active.
  final bool enabled;

  /// Returns a copy with [enabled] flipped.
  EmailDigestConfig toggleEnabled() =>
      _copyWith(enabled: !enabled);

  EmailDigestConfig _copyWith({bool? enabled}) => EmailDigestConfig(
        recipientEmail: recipientEmail,
        frequency: frequency,
        sections: sections,
        sendAtHour: sendAtHour,
        enabled: enabled ?? this.enabled,
      );

  @override
  List<Object?> get props =>
      [recipientEmail, frequency, sections, sendAtHour, enabled];
}
