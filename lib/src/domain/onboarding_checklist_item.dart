import 'package:equatable/equatable.dart';

/// Completion status of an onboarding checklist item.
enum OnboardingItemStatus { pending, inProgress, completed, skipped }

/// A single first-run onboarding checklist task with completion state.
class OnboardingChecklistItem extends Equatable {
  const OnboardingChecklistItem({
    required this.itemId,
    required this.title,
    required this.description,
    required this.status,
    required this.displayOrder,
    this.completedAt,
    this.deepLinkTarget,
  });

  final String itemId;
  final String title;
  final String description;
  final OnboardingItemStatus status;

  /// Display order for the checklist (1-based).
  final int displayOrder;

  final DateTime? completedAt;

  /// Optional deep link to navigate when the user taps the item.
  final String? deepLinkTarget;

  OnboardingChecklistItem copyWith({
    String? itemId,
    String? title,
    String? description,
    OnboardingItemStatus? status,
    int? displayOrder,
    DateTime? completedAt,
    String? deepLinkTarget,
  }) => OnboardingChecklistItem(
    itemId: itemId ?? this.itemId,
    title: title ?? this.title,
    description: description ?? this.description,
    status: status ?? this.status,
    displayOrder: displayOrder ?? this.displayOrder,
    completedAt: completedAt ?? this.completedAt,
    deepLinkTarget: deepLinkTarget ?? this.deepLinkTarget,
  );

  @override
  List<Object?> get props => [
    itemId,
    title,
    description,
    status,
    displayOrder,
    completedAt,
    deepLinkTarget,
  ];
}
