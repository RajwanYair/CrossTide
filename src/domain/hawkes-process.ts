/**
 * Hawkes process — self-exciting point process for event clustering.
 * Models how past events increase probability of future events (e.g., volatility clustering).
 */

export interface HawkesParams {
  readonly mu: number; // base intensity (background rate)
  readonly alpha: number; // excitation magnitude
  readonly beta: number; // decay rate (must be > alpha for stationarity)
}

export interface HawkesResult {
  readonly params: HawkesParams;
  readonly logLikelihood: number;
  readonly branchingRatio: number; // α/β — average # of children per event
  readonly stationaryIntensity: number; // μ / (1 - α/β)
  readonly halfLife: number; // ln(2)/β
}

/**
 * Estimate Hawkes process parameters via maximum likelihood.
 *
 * Intensity: λ(t) = μ + α Σ_{t_i < t} β·exp(-β(t - t_i))
 *
 * Log-likelihood: Σ ln(λ(t_i)) - ∫₀ᵀ λ(t)dt
 *
 * @param eventTimes - Sorted arrival times of events
 * @param T - Observation window end time (defaults to last event)
 */
export function fitHawkes(eventTimes: readonly number[], T?: number): HawkesResult {
  const n = eventTimes.length;
  if (n < 5) {
    const mu = T && T > 0 ? n / T : 1;
    return {
      params: { mu, alpha: 0, beta: 1 },
      logLikelihood: -Infinity,
      branchingRatio: 0,
      stationaryIntensity: mu,
      halfLife: Math.LN2,
    };
  }

  const endT = T ?? eventTimes[n - 1]!;
  if (endT <= 0) {
    return {
      params: { mu: 1, alpha: 0, beta: 1 },
      logLikelihood: -Infinity,
      branchingRatio: 0,
      stationaryIntensity: 1,
      halfLife: Math.LN2,
    };
  }

  // Initialize parameters
  let mu = n / endT;
  let alpha = 0.3;
  let beta = 1.0;

  // EM-style optimization (simplified coordinate descent)
  for (let iter = 0; iter < 100; iter++) {
    const prevMu = mu;
    const prevAlpha = alpha;
    const prevBeta = beta;

    // Compute intensities and auxiliary sums
    let sumA = 0; // Σ A_i where A_i = Σ_{j<i} exp(-β(t_i - t_j))

    const A: number[] = new Array(n);
    const B: number[] = new Array(n); // Σ_{j<i} (t_i-t_j)*exp(-β(t_i-t_j))

    for (let i = 0; i < n; i++) {
      let ai = 0,
        bi = 0;
      for (let j = 0; j < i; j++) {
        const dt = eventTimes[i]! - eventTimes[j]!;
        const expDecay = Math.exp(-beta * dt);
        ai += expDecay;
        bi += dt * expDecay;
      }
      A[i] = ai;
      B[i] = bi;

      sumA += ai;
    }

    // Update μ: set μ such that background explains fraction of events
    mu = Math.max(1e-6, (n - (alpha * sumA) / Math.max(1, n)) / endT);

    // Update α via gradient step
    let gradAlpha = 0;
    for (let i = 0; i < n; i++) {
      const lambda_i = mu + alpha * A[i]!;
      if (lambda_i > 0) gradAlpha += A[i]! / lambda_i;
    }
    // ∂LL/∂α = Σ Aᵢ/λᵢ - (1/β)Σ(1-exp(-β(T-tᵢ)))
    let compensator = 0;
    for (let i = 0; i < n; i++)
      compensator += (1 - Math.exp(-beta * (endT - eventTimes[i]!))) / beta;
    gradAlpha -= compensator;
    alpha = Math.max(1e-6, alpha + 0.01 * gradAlpha);

    // Ensure stationarity: α < β
    if (alpha >= beta * 0.99) {
      beta = alpha / 0.8;
    }

    // Update β via simple line search
    let gradBeta = 0;
    for (let i = 0; i < n; i++) {
      const lambda_i = mu + alpha * A[i]!;
      if (lambda_i > 0) gradBeta -= (alpha * B[i]!) / lambda_i;
    }
    for (let i = 0; i < n; i++) {
      const dt = endT - eventTimes[i]!;
      gradBeta += (alpha / (beta * beta)) * (1 - Math.exp(-beta * dt) * (1 + beta * dt));
    }
    beta = Math.max(alpha + 1e-6, beta + 0.005 * gradBeta);

    // Convergence check
    if (Math.abs(mu - prevMu) + Math.abs(alpha - prevAlpha) + Math.abs(beta - prevBeta) < 1e-8)
      break;
  }

  // Final log-likelihood
  let ll = 0;
  for (let i = 0; i < n; i++) {
    let ai = 0;
    for (let j = 0; j < i; j++) ai += Math.exp(-beta * (eventTimes[i]! - eventTimes[j]!));
    const lambda_i = mu + alpha * ai;
    if (lambda_i > 0) ll += Math.log(lambda_i);
  }
  ll -= mu * endT;
  for (let i = 0; i < n; i++) {
    ll -= (alpha / beta) * (1 - Math.exp(-beta * (endT - eventTimes[i]!)));
  }

  const branchingRatio = alpha / beta;

  return {
    params: { mu, alpha, beta },
    logLikelihood: ll,
    branchingRatio,
    stationaryIntensity: mu / (1 - branchingRatio),
    halfLife: Math.LN2 / beta,
  };
}

/**
 * Simulate a Hawkes process via thinning algorithm.
 *
 * @param params - Process parameters
 * @param T - End time
 * @param rng - Random number generator
 */
export function simulateHawkes(
  params: HawkesParams,
  T: number,
  rng: () => number = Math.random,
): readonly number[] {
  const { mu, alpha, beta } = params;
  const events: number[] = [];
  let t = 0;

  while (t < T) {
    // Current intensity upper bound
    let lambdaBar = mu;
    for (const ti of events) lambdaBar += alpha * Math.exp(-beta * (t - ti));

    // Generate candidate via exponential
    const u1 = rng() || 1e-10;
    const dt = -Math.log(u1) / lambdaBar;
    t += dt;
    if (t >= T) break;

    // Acceptance probability
    let lambdaT = mu;
    for (const ti of events) lambdaT += alpha * Math.exp(-beta * (t - ti));

    if (rng() <= lambdaT / lambdaBar) {
      events.push(t);
    }
  }

  return events;
}

/**
 * Compute time-varying intensity of a Hawkes process at given evaluation points.
 */
export function hawkesIntensity(
  eventTimes: readonly number[],
  evalPoints: readonly number[],
  params: HawkesParams,
): readonly number[] {
  const { mu, alpha, beta } = params;
  return evalPoints.map((t) => {
    let lambda = mu;
    for (const ti of eventTimes) {
      if (ti < t) lambda += alpha * Math.exp(-beta * (t - ti));
    }
    return lambda;
  });
}
