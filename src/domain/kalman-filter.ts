/**
 * Kalman filter — adaptive price smoothing and trend estimation.
 * Provides optimal linear filtering with dynamic noise adaptation.
 */

export interface KalmanState {
  readonly x: number; // state estimate (price)
  readonly v: number; // velocity estimate (trend)
  readonly p00: number; // covariance matrix element
  readonly p01: number;
  readonly p10: number;
  readonly p11: number;
}

export interface KalmanParams {
  readonly processNoise: number; // Q — how much we trust the model (lower = smoother)
  readonly measurementNoise: number; // R — how much we trust the measurement
}

/**
 * Initialize Kalman state from first observation.
 */
export function initKalman(firstPrice: number): KalmanState {
  return { x: firstPrice, v: 0, p00: 1, p01: 0, p10: 0, p11: 1 };
}

/**
 * Single Kalman filter predict + update step.
 */
export function kalmanStep(
  state: KalmanState,
  measurement: number,
  params: KalmanParams,
): KalmanState {
  const { x, v, p00, p01, p10, p11 } = state;
  const { processNoise: q, measurementNoise: r } = params;

  // Predict
  const xPred = x + v;
  const vPred = v;
  const pp00 = p00 + p01 + p10 + p11 + q;
  const pp01 = p01 + p11;
  const pp10 = p10 + p11;
  const pp11 = p11 + q;

  // Update
  const innovation = measurement - xPred;
  const s = pp00 + r; // innovation covariance

  if (s === 0) return state;

  const k0 = pp00 / s; // Kalman gain
  const k1 = pp10 / s;

  const xNew = xPred + k0 * innovation;
  const vNew = vPred + k1 * innovation;

  const np00 = pp00 - k0 * pp00;
  const np01 = pp01 - k0 * pp01;
  const np10 = pp10 - k1 * pp00;
  const np11 = pp11 - k1 * pp01;

  return { x: xNew, v: vNew, p00: np00, p01: np01, p10: np10, p11: np11 };
}

/**
 * Run Kalman filter over entire price series.
 * Returns smoothed prices and velocity (trend) estimates.
 */
export function kalmanFilter(
  prices: readonly number[],
  params: KalmanParams = { processNoise: 0.01, measurementNoise: 1 },
): { smoothed: number[]; velocity: number[] } {
  if (prices.length === 0) return { smoothed: [], velocity: [] };

  const smoothed: number[] = [];
  const velocity: number[] = [];
  let state = initKalman(prices[0]!);

  smoothed.push(state.x);
  velocity.push(state.v);

  for (let i = 1; i < prices.length; i++) {
    state = kalmanStep(state, prices[i]!, params);
    smoothed.push(state.x);
    velocity.push(state.v);
  }

  return { smoothed, velocity };
}

/**
 * Adaptive Kalman filter — adjusts measurement noise based on recent innovation.
 */
export function adaptiveKalmanFilter(
  prices: readonly number[],
  baseParams: KalmanParams = { processNoise: 0.01, measurementNoise: 1 },
  adaptWindow = 20,
): { smoothed: number[]; velocity: number[]; adaptiveR: number[] } {
  if (prices.length === 0) return { smoothed: [], velocity: [], adaptiveR: [] };

  const smoothed: number[] = [];
  const velocity: number[] = [];
  const adaptiveR: number[] = [];
  const innovations: number[] = [];

  let state = initKalman(prices[0]!);
  smoothed.push(state.x);
  velocity.push(state.v);
  adaptiveR.push(baseParams.measurementNoise);

  for (let i = 1; i < prices.length; i++) {
    const innovation = prices[i]! - (state.x + state.v);
    innovations.push(innovation);

    // Adapt R based on recent innovation variance
    let r = baseParams.measurementNoise;
    if (innovations.length >= adaptWindow) {
      const recent = innovations.slice(-adaptWindow);
      const mean = recent.reduce((s, v) => s + v, 0) / recent.length;
      let var_ = 0;
      for (const v of recent) var_ += (v - mean) ** 2;
      r = Math.max(0.01, var_ / recent.length);
    }

    state = kalmanStep(state, prices[i]!, {
      processNoise: baseParams.processNoise,
      measurementNoise: r,
    });
    smoothed.push(state.x);
    velocity.push(state.v);
    adaptiveR.push(r);
  }

  return { smoothed, velocity, adaptiveR };
}

/**
 * Generate Kalman trend signal: +1 (uptrend), -1 (downtrend), 0 (flat).
 */
export function kalmanTrendSignal(velocity: readonly number[], threshold = 0): number[] {
  return velocity.map((v) => (v > threshold ? 1 : v < -threshold ? -1 : 0));
}
