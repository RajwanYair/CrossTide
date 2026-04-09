/// Alert Handler Config — configuration for a pluggable alert notification sink.
library;

import 'package:equatable/equatable.dart';

/// The delivery channel for a custom alert handler.
enum AlertSinkType {
  /// In-app notification (default; always present).
  inApp,

  /// Discord webhook.
  discord,

  /// Slack incoming webhook.
  slack,

  /// Telegram bot message.
  telegram,

  /// Email via SMTP or API.
  email,

  /// SMS via carrier gateway or provider.
  sms,

  /// Arbitrary HTTP REST endpoint (POST JSON payload).
  restHook,
}

/// Configuration record for a single alert notification sink.
class AlertHandlerConfig extends Equatable {
  const AlertHandlerConfig({
    required this.id,
    required this.name,
    required this.sinkType,
    required this.enabled,
    required this.maxRetries,
    this.endpointUrl,
    this.credentialKeyRef,
    this.payloadTemplate,
  }) : assert(maxRetries >= 0, 'maxRetries must be >= 0');

  /// Factory for the built-in in-app handler (id = 'in_app').
  factory AlertHandlerConfig.inApp() => const AlertHandlerConfig(
    id: 'in_app',
    name: 'In-App Notification',
    sinkType: AlertSinkType.inApp,
    enabled: true,
    maxRetries: 0,
  );

  /// Stable unique identifier for this handler (e.g. 'discord_main').
  final String id;

  /// Human-readable display name.
  final String name;

  final AlertSinkType sinkType;

  /// Whether this handler is currently active.
  final bool enabled;

  /// Maximum number of delivery retries before giving up.
  final int maxRetries;

  /// Endpoint URL (webhook URL, REST endpoint, SMTP host, etc.).
  /// Not required for [AlertSinkType.inApp].
  final String? endpointUrl;

  /// Key reference into flutter_secure_storage for bearer token / password.
  final String? credentialKeyRef;

  /// Optional Mustache-style payload template string.
  final String? payloadTemplate;

  /// Returns true when this handler requires a stored credential.
  bool get requiresCredential =>
      sinkType != AlertSinkType.inApp && sinkType != AlertSinkType.restHook;

  @override
  List<Object?> get props => [
    id,
    name,
    sinkType,
    enabled,
    maxRetries,
    endpointUrl,
    credentialKeyRef,
    payloadTemplate,
  ];
}
