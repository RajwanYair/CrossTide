// ignore_for_file: invalid_use_of_protected_member
import 'package:cross_tide/src/application/webhook_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(Options());
    registerFallbackValue(RequestOptions(path: ''));
  });

  late MockDio mockDio;
  late WebhookService service;

  setUp(() {
    mockDio = MockDio();
    service = WebhookService(dio: mockDio);
  });

  test('configure sets configs', () {
    service.configure([
      const WebhookConfig(
        type: WebhookType.discord,
        url: 'https://example.com',
      ),
    ]);
    expect(service.configs, hasLength(1));
  });

  test('returns unmodifiable configs list', () {
    service.configure([]);
    expect(
      () => (service.configs as List).add(
        const WebhookConfig(type: WebhookType.discord, url: 'x'),
      ),
      throwsUnsupportedError,
    );
  });

  group('send()', () {
    test('posts to Discord URL with content key', () async {
      when(
        () => mockDio.post<void>(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).thenAnswer(
        (_) async => Response<void>(
          requestOptions: RequestOptions(path: ''),
          statusCode: 200,
        ),
      );

      service.configure([
        const WebhookConfig(
          type: WebhookType.discord,
          url: 'https://discord.com/api/webhooks/1/token',
        ),
      ]);

      await service.send('test message');

      final captured = verify(
        () => mockDio.post<void>(
          'https://discord.com/api/webhooks/1/token',
          data: captureAny(named: 'data'),
          options: any(named: 'options'),
        ),
      ).captured;

      expect((captured.first as Map)['content'], 'test message');
    });

    test('posts to Telegram URL with chat_id and text', () async {
      when(
        () => mockDio.post<void>(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).thenAnswer(
        (_) async => Response<void>(
          requestOptions: RequestOptions(path: ''),
          statusCode: 200,
        ),
      );

      service.configure([
        const WebhookConfig(
          type: WebhookType.telegram,
          url: 'https://api.telegram.org/botTOKEN/sendMessage',
          telegramChatId: '12345',
        ),
      ]);

      await service.send('hello');

      final captured = verify(
        () => mockDio.post<void>(
          'https://api.telegram.org/botTOKEN/sendMessage',
          data: captureAny(named: 'data'),
          options: any(named: 'options'),
        ),
      ).captured;

      final body = captured.first as Map;
      expect(body['chat_id'], '12345');
      expect(body['text'], 'hello');
      expect(body['parse_mode'], 'Markdown');
    });

    test('skips disabled configs', () async {
      service.configure([
        const WebhookConfig(
          type: WebhookType.discord,
          url: 'https://discord.com/api/webhooks/1/token',
          enabled: false,
        ),
      ]);

      await service.send('should not be sent');

      verifyNever(
        () => mockDio.post<void>(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      );
    });

    test('does not throw when Telegram chat_id is missing', () async {
      service.configure([
        const WebhookConfig(
          type: WebhookType.telegram,
          url: 'https://api.telegram.org/botTOKEN/sendMessage',
          // telegramChatId intentionally omitted
        ),
      ]);

      // Should complete without throwing
      await expectLater(service.send('msg'), completes);
    });

    test('does not throw when network call fails', () async {
      when(
        () => mockDio.post<void>(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: ''),
          message: 'network error',
        ),
      );

      service.configure([
        const WebhookConfig(
          type: WebhookType.discord,
          url: 'https://discord.com/api/webhooks/1/token',
        ),
      ]);

      // Must not rethrow
      await expectLater(service.send('msg'), completes);
    });

    test('sends to multiple endpoints', () async {
      when(
        () => mockDio.post<void>(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).thenAnswer(
        (_) async => Response<void>(
          requestOptions: RequestOptions(path: ''),
          statusCode: 200,
        ),
      );

      service.configure([
        const WebhookConfig(
          type: WebhookType.discord,
          url: 'https://discord.com/api/webhooks/1/token',
        ),
        const WebhookConfig(
          type: WebhookType.discord,
          url: 'https://discord.com/api/webhooks/2/token',
        ),
      ]);

      await service.send('multi');

      verify(
        () => mockDio.post<void>(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).called(2);
    });

    test('custom webhook posts with text key', () async {
      when(
        () => mockDio.post<void>(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).thenAnswer(
        (_) async => Response<void>(
          requestOptions: RequestOptions(path: ''),
          statusCode: 200,
        ),
      );

      service.configure([
        const WebhookConfig(
          type: WebhookType.custom,
          url: 'https://my-server.example.com/hook',
        ),
      ]);

      await service.send('custom msg');

      final captured = verify(
        () => mockDio.post<void>(
          'https://my-server.example.com/hook',
          data: captureAny(named: 'data'),
          options: any(named: 'options'),
        ),
      ).captured;

      expect((captured.first as Map)['text'], 'custom msg');
    });
  });
}
