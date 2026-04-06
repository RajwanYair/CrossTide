/// Webhook Alert Sink — sends alert notifications to Telegram or Discord.
///
/// Configured via [WebhookSettings] stored in secure storage.
/// Calls are fire-and-forget; failures are logged but never throw.
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

/// Supported webhook destination types.
enum WebhookType { telegram, discord, custom }

/// Immutable config for one webhook endpoint.
class WebhookConfig {
  const WebhookConfig({
    required this.type,
    required this.url,
    this.telegramChatId,
    this.enabled = true,
  });

  final WebhookType type;

  /// Full HTTPS URL.
  /// - Telegram: `https://api.telegram.org/bot.../sendMessage`
  /// - Discord:  `https://discord.com/api/webhooks/.../...`
  /// - Custom:   any HTTP POST endpoint
  final String url;

  /// Required for [WebhookType.telegram] — the destination chat_id.
  final String? telegramChatId;

  final bool enabled;
}

/// Fires POST requests to configured webhook endpoints whenever an alert fires.
class WebhookService {
  WebhookService({Dio? dio, Logger? logger})
    : _dio = dio ?? Dio(),
      _logger = logger ?? Logger();

  final Dio _dio;
  final Logger _logger;

  List<WebhookConfig> _configs = [];

  void configure(List<WebhookConfig> configs) {
    _configs = configs;
  }

  List<WebhookConfig> get configs => List.unmodifiable(_configs);

  /// Send [message] to all enabled webhook endpoints.
  ///
  /// Never throws — errors are logged and discarded.
  Future<void> send(String message) async {
    for (final cfg in _configs) {
      if (!cfg.enabled) continue;
      try {
        await _sendTo(cfg, message);
        _logger.i('WebhookService: sent to ${cfg.type.name}');
      } catch (e) {
        _logger.w('WebhookService: ${cfg.type.name} failed — $e');
      }
    }
  }

  Future<void> _sendTo(WebhookConfig cfg, String message) async {
    switch (cfg.type) {
      case WebhookType.telegram:
        final chatId = cfg.telegramChatId;
        if (chatId == null || chatId.isEmpty) {
          _logger.w('WebhookService: Telegram chat_id not set');
          return;
        }
        await _dio.post<void>(
          cfg.url,
          data: {'chat_id': chatId, 'text': message, 'parse_mode': 'Markdown'},
          options: _opts,
        );
      case WebhookType.discord:
        await _dio.post<void>(
          cfg.url,
          data: {'content': message},
          options: _opts,
        );
      case WebhookType.custom:
        await _dio.post<void>(cfg.url, data: {'text': message}, options: _opts);
    }
  }

  static final _opts = Options(
    contentType: 'application/json',
    sendTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  );
}
