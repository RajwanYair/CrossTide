import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // ── S496: ReportDeliveryReceipt ────────────────────────────────────────────
  group('ReportDeliveryReceipt', () {
    test('hasFailed false for successful delivery', () {
      const ReportDeliveryReceipt r = ReportDeliveryReceipt(
        receiptId: 'rdr1',
        reportScheduleId: 'rs1',
        deliveryMethod: ReportDeliveryMethod.email,
        recipientAddress: 'user@example.com',
        isDelivered: true,
        durationMs: 1500,
      );
      expect(r.hasFailed, isFalse);
      expect(r.isFastDelivery, isTrue);
      expect(r.hasFailureReason, isFalse);
    });

    test('hasFailed true with reason for failed delivery', () {
      const ReportDeliveryReceipt r = ReportDeliveryReceipt(
        receiptId: 'rdr2',
        reportScheduleId: 'rs2',
        deliveryMethod: ReportDeliveryMethod.webhook,
        recipientAddress: 'https://hook.example.com',
        isDelivered: false,
        durationMs: 3000,
        failureReason: 'Connection timeout',
      );
      expect(r.hasFailed, isTrue);
      expect(r.isFastDelivery, isFalse);
      expect(r.hasFailureReason, isTrue);
    });

    test('equality', () {
      const ReportDeliveryReceipt a = ReportDeliveryReceipt(
        receiptId: 'rdr1',
        reportScheduleId: 'rs1',
        deliveryMethod: ReportDeliveryMethod.inApp,
        recipientAddress: 'u1',
        isDelivered: true,
        durationMs: 500,
      );
      const ReportDeliveryReceipt b = ReportDeliveryReceipt(
        receiptId: 'rdr1',
        reportScheduleId: 'rs1',
        deliveryMethod: ReportDeliveryMethod.inApp,
        recipientAddress: 'u1',
        isDelivered: true,
        durationMs: 500,
      );
      expect(a, equals(b));
    });
  });

  // ── S497: PdfExportConfig ──────────────────────────────────────────────────
  group('PdfExportConfig', () {
    test('isLandscape and isMultiPage for landscape config', () {
      const PdfExportConfig cfg = PdfExportConfig(
        configId: 'pec1',
        title: 'Portfolio Report',
        orientation: PdfPageOrientation.landscape,
        includeSections: ['summary', 'charts', 'positions'],
        includeCharts: true,
        watermarkText: 'CONFIDENTIAL',
        pageCount: 5,
      );
      expect(cfg.isLandscape, isTrue);
      expect(cfg.isMultiPage, isTrue);
      expect(cfg.hasWatermark, isTrue);
    });

    test('isLandscape false and hasWatermark false for default portrait', () {
      const PdfExportConfig cfg = PdfExportConfig(
        configId: 'pec2',
        title: 'Simple Export',
        orientation: PdfPageOrientation.portrait,
        includeSections: ['summary'],
      );
      expect(cfg.isLandscape, isFalse);
      expect(cfg.hasWatermark, isFalse);
      expect(cfg.isMultiPage, isFalse);
    });

    test('equality', () {
      const PdfExportConfig a = PdfExportConfig(
        configId: 'pec1',
        title: 'Test',
        orientation: PdfPageOrientation.portrait,
        includeSections: ['a'],
      );
      const PdfExportConfig b = PdfExportConfig(
        configId: 'pec1',
        title: 'Test',
        orientation: PdfPageOrientation.portrait,
        includeSections: ['a'],
      );
      expect(a, equals(b));
    });
  });

  // ── S498: ScheduledReportResult ────────────────────────────────────────────
  group('ScheduledReportResult', () {
    test('isFullSuccess and deliveryRatePercent for all delivered', () {
      const ScheduledReportResult r = ScheduledReportResult(
        resultId: 'srr1',
        reportScheduleId: 'rs1',
        totalRecipients: 5,
        successfulDeliveries: 5,
        durationMs: 1200,
      );
      expect(r.isFullSuccess, isTrue);
      expect(r.failedDeliveries, equals(0));
      expect(r.deliveryRatePercent, closeTo(100.0, 0.01));
      expect(r.hasErrors, isFalse);
    });

    test('partial delivery with errors', () {
      const ScheduledReportResult r = ScheduledReportResult(
        resultId: 'srr2',
        reportScheduleId: 'rs2',
        totalRecipients: 10,
        successfulDeliveries: 7,
        durationMs: 4000,
        errorSummary: '3 recipients unreachable',
      );
      expect(r.isFullSuccess, isFalse);
      expect(r.failedDeliveries, equals(3));
      expect(r.deliveryRatePercent, closeTo(70.0, 0.01));
      expect(r.hasErrors, isTrue);
    });

    test('deliveryRatePercent is 100 when totalRecipients is zero', () {
      const ScheduledReportResult r = ScheduledReportResult(
        resultId: 'srr3',
        reportScheduleId: 'rs3',
        totalRecipients: 0,
        successfulDeliveries: 0,
        durationMs: 50,
      );
      expect(r.deliveryRatePercent, equals(100.0));
    });

    test('equality', () {
      const ScheduledReportResult a = ScheduledReportResult(
        resultId: 'srr1',
        reportScheduleId: 'rs1',
        totalRecipients: 3,
        successfulDeliveries: 3,
        durationMs: 200,
      );
      const ScheduledReportResult b = ScheduledReportResult(
        resultId: 'srr1',
        reportScheduleId: 'rs1',
        totalRecipients: 3,
        successfulDeliveries: 3,
        durationMs: 200,
      );
      expect(a, equals(b));
    });
  });

  // ── S499: ExportFormatPreference ───────────────────────────────────────────
  group('ExportFormatPreference', () {
    test('isCsvOrXlsx true for CSV format', () {
      const ExportFormatPreference pref = ExportFormatPreference(
        preferenceId: 'efp1',
        userId: 'u1',
        preferredFormat: ExportFileFormat.csv,
        includeHeaders: true,
        compressOutput: true,
      );
      expect(pref.isCsvOrXlsx, isTrue);
      expect(pref.isPdf, isFalse);
    });

    test('isPdf true for PDF format', () {
      const ExportFormatPreference pref = ExportFormatPreference(
        preferenceId: 'efp2',
        userId: 'u2',
        preferredFormat: ExportFileFormat.pdf,
      );
      expect(pref.isPdf, isTrue);
      expect(pref.isCsvOrXlsx, isFalse);
    });

    test('isCsvOrXlsx true for XLSX format', () {
      const ExportFormatPreference pref = ExportFormatPreference(
        preferenceId: 'efp3',
        userId: 'u3',
        preferredFormat: ExportFileFormat.xlsx,
      );
      expect(pref.isCsvOrXlsx, isTrue);
    });

    test('equality', () {
      const ExportFormatPreference a = ExportFormatPreference(
        preferenceId: 'efp1',
        userId: 'u1',
        preferredFormat: ExportFileFormat.json,
      );
      const ExportFormatPreference b = ExportFormatPreference(
        preferenceId: 'efp1',
        userId: 'u1',
        preferredFormat: ExportFileFormat.json,
      );
      expect(a, equals(b));
    });
  });

  // ── S500: WidgetDataFeed ───────────────────────────────────────────────────
  group('WidgetDataFeed', () {
    test('isRealtime true for realtime mode', () {
      const WidgetDataFeed feed = WidgetDataFeed(
        feedId: 'wdf1',
        widgetId: 'price_widget',
        dataKey: 'last_price',
        refreshMode: WidgetRefreshMode.realtime,
        refreshIntervalSeconds: 0,
        priority: 15,
      );
      expect(feed.isRealtime, isTrue);
      expect(feed.isHighPriority, isTrue);
      expect(feed.isFrequentRefresh, isFalse);
    });

    test('isFrequentRefresh true for periodic with short interval', () {
      const WidgetDataFeed feed = WidgetDataFeed(
        feedId: 'wdf2',
        widgetId: 'sma_widget',
        dataKey: 'sma200',
        refreshMode: WidgetRefreshMode.periodic,
        refreshIntervalSeconds: 30,
        priority: 5,
      );
      expect(feed.isFrequentRefresh, isTrue);
      expect(feed.isRealtime, isFalse);
      expect(feed.isHighPriority, isFalse);
    });

    test('isFrequentRefresh false for periodic with long interval', () {
      const WidgetDataFeed feed = WidgetDataFeed(
        feedId: 'wdf3',
        widgetId: 'candle_widget',
        dataKey: 'daily_candles',
        refreshMode: WidgetRefreshMode.periodic,
        refreshIntervalSeconds: 300,
        priority: 3,
      );
      expect(feed.isFrequentRefresh, isFalse);
    });

    test('equality', () {
      const WidgetDataFeed a = WidgetDataFeed(
        feedId: 'wdf1',
        widgetId: 'w1',
        dataKey: 'price',
        refreshMode: WidgetRefreshMode.onDemand,
        refreshIntervalSeconds: 0,
      );
      const WidgetDataFeed b = WidgetDataFeed(
        feedId: 'wdf1',
        widgetId: 'w1',
        dataKey: 'price',
        refreshMode: WidgetRefreshMode.onDemand,
        refreshIntervalSeconds: 0,
      );
      expect(a, equals(b));
    });
  });
}
