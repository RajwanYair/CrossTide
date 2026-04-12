import 'package:cross_tide/src/domain/onboarding_checklist_item.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('OnboardingChecklistItem', () {
    test('equality', () {
      const a = OnboardingChecklistItem(
        itemId: 'item1',
        title: 'Add your first ticker',
        description: 'Search for a stock and add it to your watchlist',
        status: OnboardingItemStatus.pending,
        displayOrder: 1,
      );
      const b = OnboardingChecklistItem(
        itemId: 'item1',
        title: 'Add your first ticker',
        description: 'Search for a stock and add it to your watchlist',
        status: OnboardingItemStatus.pending,
        displayOrder: 1,
      );
      expect(a, b);
    });

    test('copyWith changes status', () {
      const base = OnboardingChecklistItem(
        itemId: 'item1',
        title: 'Add your first ticker',
        description: 'Search for a stock and add it to your watchlist',
        status: OnboardingItemStatus.pending,
        displayOrder: 1,
      );
      final updated = base.copyWith(status: OnboardingItemStatus.completed);
      expect(updated.status, OnboardingItemStatus.completed);
    });

    test('props length is 7', () {
      const obj = OnboardingChecklistItem(
        itemId: 'item1',
        title: 'Add your first ticker',
        description: 'Search for a stock and add it to your watchlist',
        status: OnboardingItemStatus.pending,
        displayOrder: 1,
      );
      expect(obj.props.length, 7);
    });
  });
}
