import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // S516 — ComplianceRuleViolation
  group('ComplianceRuleViolation', () {
    const v = ComplianceRuleViolation(
      violationId: 'v1',
      ruleCode: 'FR-001',
      description: 'Short-selling ban breached',
      affectedTicker: 'AAPL',
      severityScore: 9,
      detectedAtMs: 1700000000000,
    );

    test('isCritical for score >= 8', () => expect(v.isCritical, isTrue));
    test('requiresImmediateAction when critical and unresolved', () {
      expect(v.requiresImmediateAction, isTrue);
    });
    test('resolved violation does not require action', () {
      const r = ComplianceRuleViolation(
        violationId: 'v2',
        ruleCode: 'X',
        description: 'desc',
        affectedTicker: 'X',
        severityScore: 9,
        detectedAtMs: 0,
        isResolved: true,
      );
      expect(r.requiresImmediateAction, isFalse);
    });
    test('isMinor for low score', () {
      const minor = ComplianceRuleViolation(
        violationId: 'v3',
        ruleCode: 'Y',
        description: 'd',
        affectedTicker: 'Y',
        severityScore: 2,
        detectedAtMs: 0,
      );
      expect(minor.isMinor, isTrue);
      expect(minor.isCritical, isFalse);
    });
  });

  // S517 — WashSaleDetection
  group('WashSaleDetection', () {
    const w = WashSaleDetection(
      detectionId: 'd1',
      ticker: 'AAPL',
      saleDateMs: 1700000000000,
      repurchaseDateMs: 1700000000000 + (20 * 86400000),
      disallowedLossUsd: 600,
    );

    test('daysBetween computes correctly', () {
      expect(w.daysBetween, equals(20));
    });
    test('isWithin30Days true for 20 days', () {
      expect(w.isWithin30Days, isTrue);
    });
    test('hasSignificantLoss true for >= 500', () {
      expect(w.hasSignificantLoss, isTrue);
    });
    test('outside 30 days not wash sale window', () {
      const outside = WashSaleDetection(
        detectionId: 'd2',
        ticker: 'X',
        saleDateMs: 0,
        repurchaseDateMs: 40 * 86400000,
        disallowedLossUsd: 100,
      );
      expect(outside.isWithin30Days, isFalse);
      expect(outside.hasSignificantLoss, isFalse);
    });
  });

  // S518 — PositionLimitBreach
  group('PositionLimitBreach', () {
    const b = PositionLimitBreach(
      breachId: 'br1',
      ticker: 'TSLA',
      limitShares: 1000,
      actualShares: 1300,
      detectedAtMs: 1700000000000,
    );

    test('excessShares computes correctly', () {
      expect(b.excessShares, equals(300));
    });
    test('overagePercent is 30%', () {
      expect(b.overagePercent, closeTo(30, 0.01));
    });
    test('isMajorBreach for >= 20% overage', () {
      expect(b.isMajorBreach, isTrue);
    });
    test('minor breach', () {
      const minor = PositionLimitBreach(
        breachId: 'br2',
        ticker: 'X',
        limitShares: 1000,
        actualShares: 1050,
        detectedAtMs: 0,
      );
      expect(minor.isMajorBreach, isFalse);
    });
  });

  // S519 — StressTestScenario
  group('StressTestScenario', () {
    const s = StressTestScenario(
      scenarioId: 's1',
      scenarioName: '2008 Crisis',
      equityShockPercent: -40,
      rateShockBps: 200,
      volatilityMultiplier: 3.0,
      description: 'Historical replay',
      isHistorical: true,
    );

    test('isSevere for shock <= -20%', () => expect(s.isSevere, isTrue));
    test('isHighVolatility for multiplier >= 2', () {
      expect(s.isHighVolatility, isTrue);
    });
    test('hasDescription true', () => expect(s.hasDescription, isTrue));
    test('mild scenario', () {
      const mild = StressTestScenario(
        scenarioId: 's2',
        scenarioName: 'mild',
        equityShockPercent: -5,
        rateShockBps: 25,
        volatilityMultiplier: 1.2,
      );
      expect(mild.isSevere, isFalse);
      expect(mild.isHighVolatility, isFalse);
      expect(mild.hasDescription, isFalse);
    });
  });

  // S520 — RiskFactorExposure
  group('RiskFactorExposure', () {
    const r = RiskFactorExposure(
      portfolioId: 'p1',
      factorName: 'market',
      betaCoefficient: 1.8,
      contributionPercent: 45,
    );

    test('isDominantFactor for >= 30%', () {
      expect(r.isDominantFactor, isTrue);
    });
    test('isHighBeta for abs >= 1.5', () => expect(r.isHighBeta, isTrue));
    test('isNegativeExposure false for positive beta', () {
      expect(r.isNegativeExposure, isFalse);
    });
    test('negative beta exposure', () {
      const neg = RiskFactorExposure(
        portfolioId: 'p2',
        factorName: 'value',
        betaCoefficient: -1.6,
        contributionPercent: 10,
      );
      expect(neg.isNegativeExposure, isTrue);
      expect(neg.isHighBeta, isTrue);
    });
  });

  // S521 — RegulatoryReportConfig
  group('RegulatoryReportConfig', () {
    const cfg = RegulatoryReportConfig(
      configId: 'c1',
      regulatoryBody: 'SEC',
      reportCode: 'Form 13F',
      frequency: RegulatoryFilingFrequency.quarterly,
      submissionDeadlineDays: 45,
    );

    test('isUrgent false for 45 days', () => expect(cfg.isUrgent, isFalse));
    test('isAnnual false for quarterly', () => expect(cfg.isAnnual, isFalse));
    test('urgent config', () {
      const urgent = RegulatoryReportConfig(
        configId: 'c2',
        regulatoryBody: 'FINRA',
        reportCode: 'SR-001',
        frequency: RegulatoryFilingFrequency.daily,
        submissionDeadlineDays: 2,
      );
      expect(urgent.isUrgent, isTrue);
      expect(urgent.isAnnual, isFalse);
    });
    test('annual frequency', () {
      const ann = RegulatoryReportConfig(
        configId: 'c3',
        regulatoryBody: 'ESMA',
        reportCode: 'Annual',
        frequency: RegulatoryFilingFrequency.annually,
        submissionDeadlineDays: 90,
      );
      expect(ann.isAnnual, isTrue);
    });
  });

  // S522 — AmlFlagRecord
  group('AmlFlagRecord', () {
    const flag = AmlFlagRecord(
      flagId: 'f1',
      entityId: 'acc1',
      flagType: 'STRUCTURING',
      severity: AmlFlagSeverity.critical,
      flaggedAtMs: 1700000000000,
      notes: 'Unusual pattern',
    );

    test('isCritical for critical severity', () {
      expect(flag.isCritical, isTrue);
    });
    test('isOpenHigh for uncleared high/critical', () {
      expect(flag.isOpenHigh, isTrue);
    });
    test('hasNotes true when notes non-empty', () {
      expect(flag.hasNotes, isTrue);
    });
    test('cleared flag not open high', () {
      const cleared = AmlFlagRecord(
        flagId: 'f2',
        entityId: 'acc2',
        flagType: 'X',
        severity: AmlFlagSeverity.high,
        flaggedAtMs: 0,
        isCleared: true,
      );
      expect(cleared.isOpenHigh, isFalse);
    });
  });

  // S523 — ConcentrationRiskAlert
  group('ConcentrationRiskAlert', () {
    const alert = ConcentrationRiskAlert(
      alertId: 'a1',
      portfolioId: 'p1',
      ticker: 'AAPL',
      holdingWeightPercent: 28,
      thresholdPercent: 15,
      triggeredAtMs: 1700000000000,
    );

    test('excessWeightPercent is 13', () {
      expect(alert.excessWeightPercent, closeTo(13, 0.01));
    });
    test('isSevere for excess >= 10%', () => expect(alert.isSevere, isTrue));
    test('requiresRebalancing when active and excess >= 5%', () {
      expect(alert.requiresRebalancing, isTrue);
    });
    test('inactive alert does not require rebalancing', () {
      const inactive = ConcentrationRiskAlert(
        alertId: 'a2',
        portfolioId: 'p2',
        ticker: 'X',
        holdingWeightPercent: 26,
        thresholdPercent: 15,
        triggeredAtMs: 0,
        isActive: false,
      );
      expect(inactive.requiresRebalancing, isFalse);
    });
  });

  // S524 — CounterpartyRiskScore
  group('CounterpartyRiskScore', () {
    const score = CounterpartyRiskScore(
      counterpartyId: 'cp1',
      counterpartyName: 'Goldman',
      grade: CounterpartyRiskGrade.aa,
      probabilityOfDefaultPercent: 0.1,
      exposureUsd: 2000000,
      assessedAtMs: 1700000000000,
    );

    test('isInvestmentGrade true for AA', () {
      expect(score.isInvestmentGrade, isTrue);
    });
    test('isHighRisk false for 0.1% PD', () {
      expect(score.isHighRisk, isFalse);
    });
    test('hasLargeExposure for >= 1M', () {
      expect(score.hasLargeExposure, isTrue);
    });
    test('speculative grade detection', () {
      const spec = CounterpartyRiskScore(
        counterpartyId: 'cp2',
        counterpartyName: 'X',
        grade: CounterpartyRiskGrade.ccc,
        probabilityOfDefaultPercent: 15,
        exposureUsd: 50000,
        assessedAtMs: 0,
      );
      expect(spec.isInvestmentGrade, isFalse);
      expect(spec.isHighRisk, isTrue);
    });
  });

  // S525 — LeverageUtilization
  group('LeverageUtilization', () {
    const lu = LeverageUtilization(
      portfolioId: 'p1',
      grossExposureUsd: 4000000,
      netAssetValueUsd: 1000000,
      marginUsedUsd: 800000,
      marginAvailableUsd: 200000,
      capturedAtMs: 1700000000000,
    );

    test('grossLeverageRatio is 4.0', () {
      expect(lu.grossLeverageRatio, equals(4.0));
    });
    test('isHighLeverage for >= 3.0', () => expect(lu.isHighLeverage, isTrue));
    test('marginUtilizationPercent is 80%', () {
      expect(lu.marginUtilizationPercent, closeTo(80, 0.01));
    });
    test('isMarginCallRisk for >= 85%', () {
      expect(lu.isMarginCallRisk, isFalse);
    });
    test('zero NAV returns 0 leverage', () {
      const zero = LeverageUtilization(
        portfolioId: 'p2',
        grossExposureUsd: 1000,
        netAssetValueUsd: 0,
        marginUsedUsd: 0,
        marginAvailableUsd: 0,
        capturedAtMs: 0,
      );
      expect(zero.grossLeverageRatio, equals(0));
      expect(zero.marginUtilizationPercent, equals(0));
    });
  });

  // S526 — DrawdownRecoveryPlan
  group('DrawdownRecoveryPlan', () {
    const plan = DrawdownRecoveryPlan(
      planId: 'pl1',
      portfolioId: 'p1',
      drawdownPercent: -35,
      targetRecoveryPercent: 100,
      requiredReturnPercent: 54,
      estimatedRecoveryDays: 400,
    );

    test('isDeepDrawdown for <= -20%', () {
      expect(plan.isDeepDrawdown, isTrue);
    });
    test('isLongRecovery for > 365 days', () {
      expect(plan.isLongRecovery, isTrue);
    });
    test('hasHighRequiredReturn for >= 30%', () {
      expect(plan.hasHighRequiredReturn, isTrue);
    });
    test('shallow drawdown plan', () {
      const shallow = DrawdownRecoveryPlan(
        planId: 'pl2',
        portfolioId: 'p2',
        drawdownPercent: -5,
        targetRecoveryPercent: 100,
        requiredReturnPercent: 5.3,
        estimatedRecoveryDays: 30,
      );
      expect(shallow.isDeepDrawdown, isFalse);
      expect(shallow.isLongRecovery, isFalse);
    });
  });

  // S527 — AuditTrailHash
  group('AuditTrailHash', () {
    const hash = AuditTrailHash(
      hashId: 'h1',
      previousHashId: 'h0',
      contentHash: 'abc123',
      algorithm: 'SHA-256',
      createdAtMs: 1700000000000,
    );

    test('isGenesis false when previousHashId set', () {
      expect(hash.isGenesis, isFalse);
    });
    test('isIntact when not tampered', () => expect(hash.isIntact, isTrue));
    test('isStrongAlgorithm for SHA-256', () {
      expect(hash.isStrongAlgorithm, isTrue);
    });
    test('genesis hash', () {
      const genesis = AuditTrailHash(
        hashId: 'h0',
        previousHashId: '',
        contentHash: 'genesis',
        algorithm: 'SHA-3-256',
        createdAtMs: 0,
      );
      expect(genesis.isGenesis, isTrue);
      expect(genesis.isStrongAlgorithm, isTrue);
    });
  });

  // S528 — PreTradeCheckResult
  group('PreTradeCheckResult', () {
    const passed = PreTradeCheckResult(
      checkId: 'c1',
      orderId: 'o1',
      status: PreTradeCheckStatus.passed,
      checkedAtMs: 1700000000000,
    );

    test('isPassed true', () => expect(passed.isPassed, isTrue));
    test('isBlocked false for passed', () {
      expect(passed.isBlocked, isFalse);
    });
    test('hasWarnings false when empty', () {
      expect(passed.hasWarnings, isFalse);
    });
    test('blocked check', () {
      const blocked = PreTradeCheckResult(
        checkId: 'c2',
        orderId: 'o2',
        status: PreTradeCheckStatus.hardBlocked,
        failedRules: ['MAX_POSITION'],
        warningMessages: ['Exceeds limit'],
        checkedAtMs: 0,
      );
      expect(blocked.isBlocked, isTrue);
      expect(blocked.hasWarnings, isTrue);
      expect(blocked.isPassed, isFalse);
    });
  });

  // S529 — EsgScoreSnapshot
  group('EsgScoreSnapshot', () {
    const esg = EsgScoreSnapshot(
      ticker: 'MSFT',
      environmentScore: 72,
      socialScore: 68,
      governanceScore: 85,
      compositeScore: 75,
      scoredAtMs: 1700000000000,
      provider: 'MSCI',
    );

    test('isHighEsg for composite >= 70', () => expect(esg.isHighEsg, isTrue));
    test('isLowEsg false for high composite', () {
      expect(esg.isLowEsg, isFalse);
    });
    test('isGovernanceLead when governance highest', () {
      expect(esg.isGovernanceLead, isTrue);
    });
    test('low ESG', () {
      const low = EsgScoreSnapshot(
        ticker: 'X',
        environmentScore: 20,
        socialScore: 25,
        governanceScore: 15,
        compositeScore: 20,
        scoredAtMs: 0,
      );
      expect(low.isLowEsg, isTrue);
      expect(low.isHighEsg, isFalse);
    });
  });

  // S530 — CarbonExposureEstimate
  group('CarbonExposureEstimate', () {
    const carbon = CarbonExposureEstimate(
      portfolioId: 'p1',
      scope1TonneCo2e: 100,
      scope2TonneCo2e: 50,
      scope3TonneCo2e: 300,
      weightedAverageCarbonIntensity: 250,
      assessedAtMs: 1700000000000,
    );

    test('totalTonneCo2e sums all scopes', () {
      expect(carbon.totalTonneCo2e, equals(450));
    });
    test('isHighIntensity for >= 200', () {
      expect(carbon.isHighIntensity, isTrue);
    });
    test('isScope3Dominant when scope3 > scope1+scope2', () {
      expect(carbon.isScope3Dominant, isTrue);
    });
    test('low intensity portfolio', () {
      const low = CarbonExposureEstimate(
        portfolioId: 'p2',
        scope1TonneCo2e: 10,
        scope2TonneCo2e: 5,
        scope3TonneCo2e: 10,
        weightedAverageCarbonIntensity: 50,
        assessedAtMs: 0,
      );
      expect(low.isHighIntensity, isFalse);
      expect(low.isScope3Dominant, isFalse);
    });
  });
}
