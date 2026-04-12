import 'package:equatable/equatable.dart';

/// Cryptographic hash anchoring an audit trail chain (S527).
class AuditTrailHash extends Equatable {
  const AuditTrailHash({
    required this.hashId,
    required this.previousHashId,
    required this.contentHash,
    required this.algorithm,
    required this.createdAtMs,
    this.isTampered = false,
  });

  final String hashId;

  /// ID of the previous hash in the chain (empty string = genesis).
  final String previousHashId;

  /// SHA-256 or similar hash of the audit record content.
  final String contentHash;

  /// Hash algorithm, e.g. 'SHA-256', 'SHA-3-256'.
  final String algorithm;

  /// Epoch milliseconds when this hash was created.
  final int createdAtMs;
  final bool isTampered;

  bool get isGenesis => previousHashId.isEmpty;
  bool get isIntact => !isTampered;
  bool get isStrongAlgorithm =>
      algorithm.startsWith('SHA-256') || algorithm.startsWith('SHA-3');

  @override
  List<Object?> get props => [
    hashId,
    previousHashId,
    contentHash,
    algorithm,
    createdAtMs,
    isTampered,
  ];
}
