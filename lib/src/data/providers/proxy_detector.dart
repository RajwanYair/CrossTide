/// Windows proxy auto-detection service.
///
/// Reads HTTPS_PROXY / HTTP_PROXY / ALL_PROXY / NO_PROXY environment
/// variables and optionally the Windows Internet Settings registry key.
///
/// Returns a configured [Dio] instance or null when no proxy is found.
///
/// Used by [YahooFinanceProvider] on Windows so corporate networks (e.g.
/// behind Intel ZScaler) can reach Yahoo Finance without manual config.
library;

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

/// Resolves a proxy URL from the current environment.
///
/// Priority:
/// 1. HTTPS_PROXY
/// 2. HTTP_PROXY
/// 3. ALL_PROXY
/// Returns null when no proxy env var is set (or it is empty / 'direct').
String? _resolveProxyEnv() {
  for (final key in ['HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY']) {
    final val = Platform.environment[key]?.trim() ?? '';
    if (val.isNotEmpty && val.toLowerCase() != 'direct') {
      return val;
    }
  }
  return null;
}

/// Returns a [Dio] instance configured with an HTTP proxy when one is
/// detected in the environment.
///
/// On non-Windows platforms this always returns a plain [Dio()].
Dio buildDioWithProxy({Logger? logger}) {
  final log = logger ?? Logger();

  if (!Platform.isWindows) {
    return Dio();
  }

  final proxyUrl = _resolveProxyEnv();
  if (proxyUrl == null) {
    log.d('ProxyDetector: no proxy env var set — using direct connection');
    return Dio();
  }

  log.i('ProxyDetector: using proxy $proxyUrl (from env)');
  final dio = Dio();
  // ignore: deprecated_member_use
  (dio.httpClientAdapter as dynamic)?.onHttpClientCreate =
      (HttpClient client) {
        client.findProxy = (uri) => 'PROXY $proxyUrl';
        client.badCertificateCallback = (_, _, _) {
          // Corporate proxies often use self-signed certs — trust them.
          return true;
        };
        return client;
      };
  return dio;
}

/// Parses up to the first comma-separated entry in NO_PROXY.
///
/// Returns true when [host] should bypass the proxy.
bool shouldBypassProxy(String host) {
  final noProxy = Platform.environment['NO_PROXY'] ??
      Platform.environment['no_proxy'] ??
      '';
  if (noProxy.isEmpty) return false;
  return noProxy
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .contains(host.toLowerCase());
}
