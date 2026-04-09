/// Indicator Formula — user-defined custom indicator using a composable expression tree.
library;

import 'package:equatable/equatable.dart';

/// The type of each node in the indicator expression tree.
enum FormulaNodeType {
  /// Simple moving average over [period] bars.
  sma,

  /// Exponential moving average over [period] bars.
  ema,

  /// Relative strength index over [period] bars.
  rsi,

  /// MACD value (12/26/9 EMA difference).
  macd,

  /// Closing price of the bar.
  close,

  /// Opening price of the bar.
  open,

  /// High price of the bar.
  high,

  /// Low price of the bar.
  low,

  /// Volume of the bar.
  volume,

  /// A literal constant value.
  constant,

  /// Addition of [left] and [right] child nodes.
  add,

  /// Subtraction: [left] minus [right].
  subtract,

  /// Multiplication of [left] and [right].
  multiply,

  /// Division: [left] divided by [right].
  divide,
}

/// A single node in the indicator expression tree.
class FormulaNode extends Equatable {
  const FormulaNode({
    required this.type,
    this.period,
    this.constant,
    this.left,
    this.right,
  });

  /// Convenience constructor for an SMA node with the given [period].
  factory FormulaNode.sma(int period) =>
      FormulaNode(type: FormulaNodeType.sma, period: period);

  /// Convenience constructor for an EMA node with the given [period].
  factory FormulaNode.ema(int period) =>
      FormulaNode(type: FormulaNodeType.ema, period: period);

  /// Convenience constructor for a literal constant.
  factory FormulaNode.literalConstant(double value) =>
      FormulaNode(type: FormulaNodeType.constant, constant: value);

  /// Convenience constructor for an addition node.
  factory FormulaNode.add(FormulaNode left, FormulaNode right) =>
      FormulaNode(type: FormulaNodeType.add, left: left, right: right);

  final FormulaNodeType type;

  /// Look-back period for SMA/EMA/RSI/MACD nodes.
  final int? period;

  /// Literal value for [FormulaNodeType.constant] nodes.
  final double? constant;

  final FormulaNode? left;
  final FormulaNode? right;

  /// Returns true if this node has no children (terminal node).
  bool get isLeaf => left == null && right == null;

  @override
  List<Object?> get props => [type, period, constant, left, right];
}

/// A named user-defined indicator composed from a [FormulaNode] expression tree.
class IndicatorFormula extends Equatable {
  const IndicatorFormula({
    required this.id,
    required this.name,
    required this.rootNode,
    required this.outputUnit,
    this.description,
  });

  /// Stable unique identifier (e.g. UUID or slug).
  final String id;

  final String name;

  /// Root of the expression tree. Evaluate this node recursively to compute the indicator.
  final FormulaNode rootNode;

  /// Human-readable output unit (e.g. 'price', '%', 'ratio', 'volume').
  final String outputUnit;

  final String? description;

  @override
  List<Object?> get props => [id, name, rootNode, outputUnit, description];
}
