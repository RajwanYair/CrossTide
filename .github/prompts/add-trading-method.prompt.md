---
description: "Step-by-step guide for adding a new MethodSignal-based trading method detector with consensus integration."
agent: "domain-feature"
argument-hint: "Name of the trading method (e.g. 'Stochastic Oscillator', 'Williams %R')"
---
# Add Trading Method: {{input}}

Follow the `add-trading-method` skill workflow. Load `.github/skills/add-trading-method/SKILL.md` first.

## Required Outcome
Implement a production-ready method detector that is fully integrated with:
- `AlertType`
- `ConsensusEngine`
- `WeightedConsensusEngine`
- `RefreshService`
- tests

Only extend notifications if the method requires standalone delivery.

## Validation
```bash
flutter analyze --fatal-infos
dart format --set-exit-if-changed lib test
flutter test --coverage --timeout 30s
```
