/**
 * Markov chain model — state transition probability matrices for market regimes.
 * Estimates regime switching probabilities from observed state sequences.
 */

export interface MarkovChain {
  readonly states: readonly string[];
  readonly transitionMatrix: readonly (readonly number[])[]; // P[i][j] = P(state_j | state_i)
  readonly stationaryDistribution: readonly number[];
  readonly meanRecurrenceTime: readonly number[]; // 1/π_i
}

export interface RegimeSequence {
  readonly states: readonly number[]; // integer state indices
  readonly n: number;
}

/**
 * Estimate transition matrix from observed state sequence using maximum likelihood.
 *
 * P_ij = count(i→j) / count(i→*)
 *
 * @param stateSequence - Array of integer state indices
 * @param numStates - Total number of possible states
 */
export function estimateTransitionMatrix(
  stateSequence: readonly number[],
  numStates: number,
): readonly (readonly number[])[] {
  const counts: number[][] = Array.from(
    { length: numStates },
    () => new Array(numStates).fill(0) as number[],
  );

  for (let t = 0; t < stateSequence.length - 1; t++) {
    const from = stateSequence[t]!;
    const to = stateSequence[t + 1]!;
    if (from >= 0 && from < numStates && to >= 0 && to < numStates) {
      counts[from]![to]!++;
    }
  }

  return counts.map((row) => {
    const rowSum = row.reduce((s, c) => s + c, 0);
    return rowSum > 0
      ? row.map((c) => c / rowSum)
      : row.map((_, j) => (j === row.indexOf(Math.max(...row)) ? 1 : 1 / numStates));
  });
}

/**
 * Compute stationary distribution π such that πP = π.
 * Uses power iteration.
 */
export function stationaryDistribution(
  P: readonly (readonly number[])[],
  maxIter = 1000,
  tol = 1e-10,
): readonly number[] {
  const n = P.length;
  if (n === 0) return [];

  let pi = new Array(n).fill(1 / n) as number[];
  const piNext = new Array(n).fill(0) as number[];

  for (let iter = 0; iter < maxIter; iter++) {
    piNext.fill(0);
    // π_next[j] = Σᵢ π[i] * P[i][j]
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        piNext[j] += pi[i]! * (P[i]?.[j] ?? 0);
      }
    }

    // Check convergence
    let maxDiff = 0;
    for (let i = 0; i < n; i++) maxDiff = Math.max(maxDiff, Math.abs(piNext[i]! - pi[i]!));
    pi = [...piNext];
    if (maxDiff < tol) break;
  }

  return pi;
}

/**
 * Compute mean first passage times from state i to state j.
 * M_ij = expected number of steps to reach j starting from i.
 * For recurrence: M_ii = 1/π_i
 */
export function meanRecurrenceTime(pi: readonly number[]): readonly number[] {
  return pi.map((p) => (p > 0 ? 1 / p : Infinity));
}

/**
 * Classify market returns into discrete regime states.
 * Simple threshold-based classification.
 *
 * @param returns - Return series
 * @param thresholds - Boundaries between states (sorted ascending)
 * @param labels - State labels
 */
export function classifyRegimes(
  returns: readonly number[],
  thresholds: readonly number[],
  labels: readonly string[],
): RegimeSequence & { readonly labels: readonly string[] } {
  const states = returns.map((r) => {
    let state = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (r > thresholds[i]!) state = i + 1;
    }
    return state;
  });

  return { states, n: states.length, labels };
}

/**
 * Build complete Markov chain model from returns.
 */
export function buildMarkovChain(
  returns: readonly number[],
  thresholds: readonly number[] = [-0.01, 0.01],
  labels: readonly string[] = ["bear", "neutral", "bull"],
): MarkovChain {
  const numStates = thresholds.length + 1;
  const regime = classifyRegimes(returns, thresholds, labels);
  const P = estimateTransitionMatrix(regime.states, numStates);
  const pi = stationaryDistribution(P);
  const mrt = meanRecurrenceTime(pi);

  return {
    states: labels,
    transitionMatrix: P,
    stationaryDistribution: pi,
    meanRecurrenceTime: mrt,
  };
}

/**
 * Simulate future states from a Markov chain.
 */
export function simulateMarkovChain(
  P: readonly (readonly number[])[],
  startState: number,
  steps: number,
  rng: () => number = Math.random,
): readonly number[] {
  const path: number[] = [startState];
  let current = startState;

  for (let t = 0; t < steps; t++) {
    const row = P[current];
    if (!row) break;
    const u = rng();
    let cumProb = 0;
    let next = 0;
    for (let j = 0; j < row.length; j++) {
      cumProb += row[j]!;
      if (u <= cumProb) {
        next = j;
        break;
      }
    }
    path.push(next);
    current = next;
  }

  return path;
}
