import 'package:cross_tide/src/application/dividend_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = DividendService();
  final now = DateTime(2025, 4, 7);

  final payments = [
    DividendPayment(
      ticker: 'AAPL',
      exDate: DateTime(2025, 1, 15),
      payDate: DateTime(2025, 1, 31),
      amountPerShare: 0.25,
    ),
    DividendPayment(
      ticker: 'AAPL',
      exDate: DateTime(2025, 4, 1),
      payDate: DateTime(2025, 4, 15),
      amountPerShare: 0.25,
    ),
  ];

  test('summarize computes trailing dividend', () {
    final summary = service.summarize(
      ticker: 'AAPL',
      payments: payments,
      currentPrice: 175.0,
      asOf: now,
    );
    expect(summary.annualDividend, 0.50);
    expect(summary.paymentCount, 2);
  });

  test('project computes annual income from holdings', () {
    final summaryAAPL = service.summarize(
      ticker: 'AAPL',
      payments: payments,
      currentPrice: 175.0,
      asOf: now,
    );
    final projection = service.project(
      holdings: {'AAPL': 100.0},
      summaries: {'AAPL': summaryAAPL},
      totalCost: 15000.0,
    );
    expect(projection.annualIncome, closeTo(50.0, 0.01));
    expect(projection.monthlyIncome, closeTo(50.0 / 12, 0.01));
  });
}
