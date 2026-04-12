import 'package:cross_tide/src/domain/platform_build_info.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PlatformBuildInfo', () {
    test('equality', () {
      const a = PlatformBuildInfo(
        osName: 'Windows',
        osVersion: 'Windows 11',
        appVersion: '2.21.0',
        buildNumber: '42',
        flutterVersion: '3.x',
        dartVersion: '3.11.4',
        isDebugBuild: false,
      );
      const b = PlatformBuildInfo(
        osName: 'Windows',
        osVersion: 'Windows 11',
        appVersion: '2.21.0',
        buildNumber: '42',
        flutterVersion: '3.x',
        dartVersion: '3.11.4',
        isDebugBuild: false,
      );
      expect(a, b);
    });

    test('copyWith changes isDebugBuild', () {
      const base = PlatformBuildInfo(
        osName: 'Windows',
        osVersion: 'Windows 11',
        appVersion: '2.21.0',
        buildNumber: '42',
        flutterVersion: '3.x',
        dartVersion: '3.11.4',
        isDebugBuild: false,
      );
      final updated = base.copyWith(isDebugBuild: true);
      expect(updated.isDebugBuild, true);
    });

    test('props length is 7', () {
      const obj = PlatformBuildInfo(
        osName: 'Windows',
        osVersion: 'Windows 11',
        appVersion: '2.21.0',
        buildNumber: '42',
        flutterVersion: '3.x',
        dartVersion: '3.11.4',
        isDebugBuild: false,
      );
      expect(obj.props.length, 7);
    });
  });
}
