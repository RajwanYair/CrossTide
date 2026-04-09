/// Alert Handler Plugin — configures a custom notification sink (Slack, Teams, SMS, etc.).
library;

import 'package:equatable/equatable.dart';

/// The type of notification sink this plugin targets.
enum PluginSinkType {
  /// Slack incoming-webhook or bot API.
  slack,

  /// Discord webhook.
  discord,

  /// Telegram bot.
  telegram,

  /// Microsoft Teams webhook.
  microsoftTeams,

  /// Generic outbound webhook (any REST endpoint).
  webhook,

  /// SMS via a configured gateway.
  sms,

  /// Outbound email via SMTP or a transactional provider.
  email,

  /// Custom REST endpoint defined by the user.
  customRest,
}

/// A key/value credential holder — the value is a secure-storage key reference,
/// NOT the raw secret.
class PluginCredential extends Equatable {
  const PluginCredential({
    required this.key,
    required this.storageKeyRef,
  });

  final String key;

  /// Key into flutter_secure_storage — never stores the raw secret in this object.
  final String storageKeyRef;

  @override
  List<Object?> get props => [key, storageKeyRef];
}

/// Configures a single custom alert handler plugin.
class AlertHandlerPlugin extends Equatable {
  const AlertHandlerPlugin({
    required this.id,
    required this.name,
    required this.sinkType,
    required this.enabled,
    required this.credentials,
    this.webhookUrl,
    this.payloadTemplate,
  });

  /// Creates a disabled plugin shell for the given [sinkType].
  factory AlertHandlerPlugin.disabled(PluginSinkType type, String name) =>
      AlertHandlerPlugin(
        id: '${type.name}-$name',
        name: name,
        sinkType: type,
        enabled: false,
        credentials: const [],
      );

  final String id;
  final String name;
  final PluginSinkType sinkType;
  final bool enabled;
  final List<PluginCredential> credentials;

  /// Pre-configured webhook URL (for webhook/Slack/Discord/Teams sinks).
  final String? webhookUrl;

  /// Optional Mustache-style payload template; null uses the default format.
  final String? payloadTemplate;

  /// Returns a copy with [enabled] set to true.
  AlertHandlerPlugin enable() => AlertHandlerPlugin(
        id: id,
        name: name,
        sinkType: sinkType,
        enabled: true,
        credentials: credentials,
        webhookUrl: webhookUrl,
        payloadTemplate: payloadTemplate,
      );

  /// Returns a copy with [enabled] set to false.
  AlertHandlerPlugin disable() => AlertHandlerPlugin(
        id: id,
        name: name,
        sinkType: sinkType,
        enabled: false,
        credentials: credentials,
        webhookUrl: webhookUrl,
        payloadTemplate: payloadTemplate,
      );

  @override
  List<Object?> get props =>
      [id, name, sinkType, enabled, credentials, webhookUrl, payloadTemplate];
}
