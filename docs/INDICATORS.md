# 📊 CrossTide Indicator Reference

> Auto-generated from `src/domain/` JSDoc.
> 218 modules | 679 exported functions | 361 interfaces

## 📋 Summary Table

| Module | Category | Functions | Description |
| --- | --- | --- | --- |
| [`Ad Line`](#ad-line) | Volume Indicators | 1 | Accumulation/Distribution Line (Marc Chaikin). Cumulative volume-weighted mon… |
| [`Adaptive Rsi`](#adaptive-rsi) | Trend Indicators | 1 | Adaptive RSI — RSI with a dynamically adjusted lookback period based on price… |
| [`Adx Calculator`](#adx-calculator) | Other | 2 | ADX (Average Directional Index) — Pure domain logic. Ported from Dart: lib/sr… |
| [`Adx Method`](#adx-method) | Signal Methods | 1 | ADX Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/adx… |
| [`Alert Proximity`](#alert-proximity) | Alerts | 5 | Price alert proximity check — determine how close current prices are to confi… |
| [`Alert State Machine`](#alert-state-machine) | Alerts | 3 | Alert State Machine — Pure domain logic. Ported from Dart: lib/src/domain/ent… |
| [`Analytics`](#analytics) | Other | 5 | Analytics Calculators — Sharpe ratio, Sortino ratio, max drawdown, Fibonacci … |
| [`Anchored Vwap`](#anchored-vwap) | Volume Indicators | 1 | Anchored VWAP: cumulative volume-weighted average price starting at a chosen … |
| [`Aroon`](#aroon) | Oscillators & Momentum | 1 | Aroon indicator (Chande, 1995). Measures bars since last N-period high/low. A… |
| [`Atr Calculator`](#atr-calculator) | Volatility Indicators | 2 | ATR Calculator — Average True Range. Ported from Dart: lib/src/domain/atr_cal… |
| [`Atr Trailing Stop`](#atr-trailing-stop) | Volatility Indicators | 5 | ATR trailing stop — dynamic stop-loss levels based on Average True Range for … |
| [`Autocorrelation`](#autocorrelation) | Statistical Analysis | 6 | Autocorrelation — serial correlation analysis for price returns. Detects mome… |
| [`Awesome Oscillator`](#awesome-oscillator) | Oscillators & Momentum | 1 | Awesome Oscillator (Bill Williams): AO = SMA(median, fast=5) - SMA(median, sl… |
| [`Backtest Engine`](#backtest-engine) | Backtesting | 2 | Backtest Engine — run method signals against historical candles. |
| [`Backtest Metrics`](#backtest-metrics) | Backtesting | 8 | Backtest performance metrics. Pure module that converts an equity curve plus … |
| [`Bar Replay`](#bar-replay) | Other | 1 | Bar Replay — step through historical OHLCV candles with play/pause/speed/seek. |
| [`Base64 Url`](#base64-url) | Other | 4 | URL-safe Base64 encoding/decoding (RFC 4648 §5). Replaces `+` with `-`, `/` w… |
| [`Benchmark`](#benchmark) | Other | 3 | Benchmark comparison helpers — compute the normalized "performance vs benchma… |
| [`Black Scholes`](#black-scholes) | Other | 4 | Black-Scholes option pricing model and Greeks. Pure math — no options chain d… |
| [`Bollinger Calculator`](#bollinger-calculator) | Volatility Indicators | 2 | Bollinger Bands Calculator — Pure domain logic. Ported from Dart: lib/src/dom… |
| [`Bollinger Method`](#bollinger-method) | Signal Methods | 1 | Bollinger Bands Method Detector — Pure domain logic. Ported from Dart: lib/sr… |
| [`Breakout Detector`](#breakout-detector) | Pattern Recognition | 5 | Breakout detector — identify price breakouts above resistance or below suppor… |
| [`Candlestick Patterns`](#candlestick-patterns) | Pattern Recognition | 8 | Candlestick pattern detector — identify common bullish/bearish single and mul… |
| [`Causal Impact`](#causal-impact) | Other | 1 | Causal impact analysis — simplified Bayesian structural time series. Estimate… |
| [`Cci Calculator`](#cci-calculator) | Other | 2 | CCI (Commodity Channel Index) — Pure domain logic. Ported from Dart: lib/src/… |
| [`Cci Method`](#cci-method) | Signal Methods | 1 | CCI Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/cci… |
| [`Chaikin Money Flow`](#chaikin-money-flow) | Volume Indicators | 1 | Chaikin Money Flow (Marc Chaikin). For each bar: MFM = ((C - L) - (H - C)) / … |
| [`Chaikin Oscillator`](#chaikin-oscillator) | Oscillators & Momentum | 1 | Chaikin Oscillator (Marc Chaikin). MACD applied to the Accumulation/Distribut… |
| [`Chande Momentum Oscillator`](#chande-momentum-oscillator) | Oscillators & Momentum | 1 | Chande Momentum Oscillator (Tushar Chande, 1994). diff[i]   = close[i] - clos… |
| [`Changepoint Detection`](#changepoint-detection) | Other | 2 | Bayesian changepoint detection — identifies structural breaks in time series.… |
| [`Chart Comparison`](#chart-comparison) | Chart Types | 2 | Chart comparison — normalizes multiple ticker candle series to percentage cha… |
| [`Choppiness Index`](#choppiness-index) | Trend Indicators | 1 | Choppiness Index. E.W. Dreiss's measure of whether the market is trending (lo… |
| [`Cointegration`](#cointegration) | Statistical Analysis | 5 | Cointegration test — Engle-Granger two-step method for pairs trading. Tests w… |
| [`Commission`](#commission) | Backtesting | 4 | Commission & slippage model for backtesting. |
| [`Connors Rsi`](#connors-rsi) | Other | 1 | Connors RSI (Larry Connors). Composite of three components: 1. RSI(close, rsi… |
| [`Consensus Engine`](#consensus-engine) | Signal Methods | 1 | Consensus Engine — Pure domain logic. Ported from Dart: lib/src/domain/consen… |
| [`Coppock Curve`](#coppock-curve) | Oscillators & Momentum | 1 | Coppock Curve (Edwin Coppock, 1962). Long-term momentum: coppock = WMA( ROC(c… |
| [`Copula`](#copula) | Statistical Analysis | 6 | Copula dependence — models joint tail dependence between assets. Supports Cla… |
| [`Corp Actions`](#corp-actions) | Other | 4 | Corporate Action Adjustment — pure functions for adjusting OHLCV data for sto… |
| [`Correlation Check`](#correlation-check) | Statistical Analysis | 4 | Ticker correlation quick-check — compute Pearson correlation coefficient betw… |
| [`Correlation Heatmap`](#correlation-heatmap) | Statistical Analysis | 3 | Correlation Heatmap render-data helpers (G22). |
| [`Correlation Matrix`](#correlation-matrix) | Statistical Analysis | 2 | Pearson correlation between aligned numeric series. Produces a symmetric N×N … |
| [`Correlation Scanner`](#correlation-scanner) | Statistical Analysis | 1 | Correlation scanner — scan multiple assets to find highest/lowest correlated … |
| [`Cross Up Detector`](#cross-up-detector) | Other | 1 | Cross-Up Detector — Pure domain logic. Ported from Dart: lib/src/domain/cross… |
| [`Custom Index`](#custom-index) | Other | 3 | Custom index builder — create equal-weighted or cap-weighted custom indices f… |
| [`Dca Simulator`](#dca-simulator) | Other | 4 | Dollar-cost average (DCA) simulator — model recurring investments and calcula… |
| [`Ddm`](#ddm) | Other | 5 | Dividend Discount Model (DDM) — intrinsic value estimation. Implements Gordon… |
| [`Dema Tema`](#dema-tema) | Volatility Indicators | 2 | DEMA / TEMA — Patrick Mulloy (1994). Reduce EMA lag. DEMA = 2*EMA  - EMA(EMA)… |
| [`Dispersion Trading`](#dispersion-trading) | Other | 4 | Dispersion trading — index vol vs constituent vol, implied correlation. Explo… |
| [`Distribution Fit`](#distribution-fit) | Other | 5 | Distribution fitting tests — Kolmogorov-Smirnov and Anderson-Darling. Goodnes… |
| [`Divergence Detector`](#divergence-detector) | Oscillators & Momentum | 1 | Divergence Detector — detect bullish and bearish divergences between price an… |
| [`Dividend Analytics`](#dividend-analytics) | Other | 2 | Dividend Analytics — pure functions for analyzing dividend history: yield cal… |
| [`Dividend Calendar`](#dividend-calendar) | Other | 5 | Dividend calendar planner — track ex-dividend dates, payment schedules, and p… |
| [`Donchian`](#donchian) | Other | 1 | Donchian channels: highest-high and lowest-low over a lookback window, used b… |
| [`Dpo`](#dpo) | Oscillators & Momentum | 1 | Detrended Price Oscillator (DPO). Removes the trend by subtracting a displace… |
| [`Drawdown Analyzer`](#drawdown-analyzer) | Other | 5 | Drawdown analyzer — compute peak-to-trough drawdowns from an equity curve or … |
| [`Drawdown Recovery`](#drawdown-recovery) | Other | 2 | Drawdown recovery analysis — estimate recovery patterns, speeds, and probabil… |
| [`Earnings Calendar`](#earnings-calendar) | Other | 5 | Earnings Calendar domain — pure types and transforms (H18). |
| [`Earnings Surprise`](#earnings-surprise) | Oscillators & Momentum | 8 | Earnings surprise tracker — record and analyze actual vs estimated EPS for po… |
| [`Ease Of Movement`](#ease-of-movement) | Volume Indicators | 1 | Richard Arms' Ease of Movement (EOM, EMV). Highlights how easily price moves … |
| [`Economic Calendar`](#economic-calendar) | Other | 12 | Economic calendar domain helpers (I10). |
| [`Efficiency Ratio`](#efficiency-ratio) | Other | 1 | Kaufman Efficiency Ratio (ER) — measures how efficiently price moves in a giv… |
| [`Efficient Frontier`](#efficient-frontier) | Other | 5 | Efficient frontier — Markowitz mean-variance portfolio optimization. Finds op… |
| [`Elder Impulse`](#elder-impulse) | Other | 1 | Elder Impulse System (Alexander Elder, "Come Into My Trading Room"). Combines… |
| [`Elder Ray`](#elder-ray) | Other | 1 | Elder Ray (Alexander Elder, 1989). Measures bull/bear pressure relative to an… |
| [`Ema Calculator`](#ema-calculator) | Other | 2 | EMA Calculator — Pure domain logic. Ported from Dart: lib/src/domain/ema_calc… |
| [`Entropy`](#entropy) | Other | 6 | Entropy analysis — measures disorder/randomness in time series. Higher entrop… |
| [`Envelope`](#envelope) | Trend Indicators | 1 | Moving Average Envelope. Symmetric upper/lower bands at a fixed percentage ab… |
| [`Equity Curve`](#equity-curve) | Other | 3 | Build an equity curve from a list of closed trades, optionally compounding on… |
| [`Etf Drilldown`](#etf-drilldown) | Other | 5 | ETF Constituent Drilldown domain (G18). |
| [`Factor Model`](#factor-model) | Other | 3 | Fama-French factor model — multi-factor attribution for portfolio returns. 3-… |
| [`Fibonacci`](#fibonacci) | Other | 5 | Fibonacci retracement & extension calculator — compute key Fibonacci levels f… |
| [`Fisher Transform`](#fisher-transform) | Other | 1 | Fisher Transform (John Ehlers, 2002). Applied to the median price, normalised… |
| [`Force Index`](#force-index) | Volume Indicators | 2 | Force Index (Alexander Elder, 1993). Combines price change and volume to gaug… |
| [`Fourier Cycles`](#fourier-cycles) | Other | 5 | Fourier cycle analysis — Discrete Fourier Transform for detecting dominant cy… |
| [`Fractal Dimension`](#fractal-dimension) | Trend Indicators | 4 | Fractal dimension — measures market complexity and roughness. Higher fractal … |
| [`Fractals`](#fractals) | Other | 1 | Bill Williams Fractals. A bullish fractal forms at index `i` when the low at … |
| [`Gap Scanner`](#gap-scanner) | Other | 8 | Gap detection scanner — identify price gaps (open vs prev close) for gap-fill… |
| [`Garch`](#garch) | Volatility Indicators | 4 | GARCH(1,1) volatility model — Generalized Autoregressive Conditional Heterosk… |
| [`Garman Klass`](#garman-klass) | Volatility Indicators | 6 | Garman-Klass and related intraday volatility estimators. More efficient than … |
| [`Granger Causality`](#granger-causality) | Other | 3 | Granger causality — test whether one time series helps predict another. Uses … |
| [`Hawkes Process`](#hawkes-process) | Volatility Indicators | 3 | Hawkes process — self-exciting point process for event clustering. Models how… |
| [`Heatmap Drilldown`](#heatmap-drilldown) | Other | 6 | Heatmap Sector Drill-down domain helpers (G21). |
| [`Heikin Ashi`](#heikin-ashi) | Other | 1 | Heikin-Ashi candle transform. Smooths price action by replacing each OHLC bar… |
| [`Hull Ma`](#hull-ma) | Trend Indicators | 1 | Hull Moving Average — Alan Hull (2005). Smooth + responsive: HMA(n) = WMA( 2*… |
| [`Hurst Exponent`](#hurst-exponent) | Trend Indicators | 3 | Hurst exponent — measure whether a time series is trending, mean-reverting, o… |
| [`Ichimoku`](#ichimoku) | Other | 1 | Ichimoku Kinko Hyo — five line indicator. Standard parameters (9/26/52) shift… |
| [`Implied Volatility`](#implied-volatility) | Volatility Indicators | 3 | Implied volatility surface — construct vol smile/skew from option prices. Use… |
| [`Indicator Config`](#indicator-config) | Other | 1 | Indicator configuration schema — per-indicator period/threshold/color (Q4 / R… |
| [`Information Ratio`](#information-ratio) | Other | 7 | Information ratio and related performance metrics. Measures risk-adjusted exc… |
| [`Insider Transactions`](#insider-transactions) | Other | 1 | Insider Transactions Analysis — pure functions to analyze insider buying/sell… |
| [`Intraday Range`](#intraday-range) | Other | 7 | Intraday high/low distance — calculate how far the current price is from the … |
| [`Jump Diffusion`](#jump-diffusion) | Other | 3 | Merton Jump Diffusion model — extends geometric Brownian motion with Poisson … |
| [`Kagi`](#kagi) | Chart Types | 2 | Kagi chart computation — Q26. |
| [`Kalman Filter`](#kalman-filter) | Trend Indicators | 5 | Kalman filter — adaptive price smoothing and trend estimation. Provides optim… |
| [`Kama`](#kama) | Trend Indicators | 1 | Perry Kaufman's Adaptive Moving Average (KAMA). Reacts faster when trend is s… |
| [`Kelly Criterion`](#kelly-criterion) | Other | 4 | Kelly criterion calculator — determine optimal position sizing based on win r… |
| [`Keltner`](#keltner) | Volatility Indicators | 1 | Keltner channels: EMA midline ± multiplier × ATR. Common defaults are length=… |
| [`Klinger Oscillator`](#klinger-oscillator) | Oscillators & Momentum | 1 | Klinger Volume Oscillator (KVO). Stephen Klinger's volume-based momentum indi… |
| [`Kst`](#kst) | Other | 1 | Know Sure Thing (Martin Pring, 1992). Smoothed weighted sum of four rate-of-c… |
| [`Linear Regression`](#linear-regression) | Other | 3 | Ordinary least squares linear regression on (x, y) pairs and a convenience fo… |
| [`Liquidity Metrics`](#liquidity-metrics) | Other | 6 | Liquidity metrics — measures of market liquidity and trading costs. Includes … |
| [`Ma Crossover`](#ma-crossover) | Other | 2 | Moving-average crossover detector. Given two pre-computed series (typically f… |
| [`Ma Ribbon`](#ma-ribbon) | Trend Indicators | 3 | Moving average ribbon — compute multiple MAs (5,10,20,50,100,200) with spread… |
| [`Macd Calculator`](#macd-calculator) | Other | 1 | MACD Calculator — Pure domain logic. Ported from Dart: lib/src/domain/macd_ca… |
| [`Macd Method`](#macd-method) | Signal Methods | 1 | MACD Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/ma… |
| [`Macro Dashboard`](#macro-dashboard) | Other | 6 | Macro Dashboard domain — pure regime classification and formatters (H19). |
| [`Market Breadth`](#market-breadth) | Other | 2 | Market Breadth domain — pure computation layer (G23). |
| [`Market Hours`](#market-hours) | Other | 6 | Market-hours detection for WebSocket connection gating (R24). |
| [`Market Impact`](#market-impact) | Other | 3 | Market impact model (Almgren-Chriss) — optimal execution with price impact. E… |
| [`Market Regime`](#market-regime) | Other | 10 | Market regime detection (I9). |
| [`Markov Chain`](#markov-chain) | Volatility Indicators | 6 | Markov chain model — state transition probability matrices for market regimes… |
| [`Mass Index`](#mass-index) | Trend Indicators | 1 | Mass Index (Donald Dorsey, 1990s). Identifies trend reversals from range expa… |
| [`Max Diversification`](#max-diversification) | Other | 1 | Maximum Diversification Portfolio — weights that maximize the diversification… |
| [`Mean Reversion`](#mean-reversion) | Trend Indicators | 6 | Mean reversion scanner — identify assets that are far from their moving avera… |
| [`Mfe Mae`](#mfe-mae) | Other | 1 | MFE/MAE Analysis — Max Favorable Excursion / Max Adverse Excursion. |
| [`Mfi Calculator`](#mfi-calculator) | Volume Indicators | 2 | MFI (Money Flow Index) — Pure domain logic. Ported from Dart: lib/src/domain/… |
| [`Mfi Method`](#mfi-method) | Signal Methods | 1 | MFI Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/mfi… |
| [`Micho Method`](#micho-method) | Signal Methods | 1 | Micho Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/m… |
| [`Momentum Rank`](#momentum-rank) | Oscillators & Momentum | 6 | Multi-ticker momentum rank — rank tickers by rate-of-change performance over … |
| [`Momentum`](#momentum) | Oscillators & Momentum | 1 | Momentum oscillator. Simple price difference over `period` bars: momentum[i] … |
| [`Monte Carlo`](#monte-carlo) | Other | 2 | Monte Carlo simulation — generate random portfolio outcome scenarios using hi… |
| [`Mtf Confluence`](#mtf-confluence) | Other | 1 | Multi-Timeframe Confluence — evaluates signals across daily, weekly, and mont… |
| [`Multi Timeframe`](#multi-timeframe) | Trend Indicators | 5 | Multi-timeframe trend — consolidate trend signals across daily, weekly, and m… |
| [`Name Enrichment`](#name-enrichment) | Other | 5 | Company name enrichment helpers (G19). |
| [`News Digest`](#news-digest) | Other | 11 | News digest domain helpers (I11). |
| [`Obv Calculator`](#obv-calculator) | Volume Indicators | 2 | OBV (On-Balance Volume) — Pure domain logic. Ported from Dart: lib/src/domain… |
| [`Obv Method`](#obv-method) | Signal Methods | 1 | OBV Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/obv… |
| [`Omega Ratio`](#omega-ratio) | Other | 2 | Omega Ratio — probability-weighted ratio of gains vs losses. |
| [`Optimal Turnover`](#optimal-turnover) | Other | 4 | Optimal portfolio turnover — transaction cost-aware rebalancing. Finds the cl… |
| [`Order Flow`](#order-flow) | Volume Indicators | 5 | Order flow imbalance — buy/sell pressure from tick-level trade classification… |
| [`Ornstein Uhlenbeck`](#ornstein-uhlenbeck) | Volatility Indicators | 4 | Ornstein-Uhlenbeck (OU) process — mean-reversion parameter estimation. Models… |
| [`Pair Correlation`](#pair-correlation) | Statistical Analysis | 6 | Pair correlation calculator — compute Pearson correlation between ticker retu… |
| [`Pairs Trading`](#pairs-trading) | Other | 4 | Pairs trading signals — z-score based entry/exit for cointegrated pairs. Gene… |
| [`Parabolic Sar Calculator`](#parabolic-sar-calculator) | Other | 2 | Parabolic SAR — Pure domain logic. Ported from Dart: lib/src/domain/parabolic… |
| [`Pattern Backtest`](#pattern-backtest) | Backtesting | 3 | Pattern backtesting engine — historical win-rate validation (I3). |
| [`Pattern Recognition`](#pattern-recognition) | Pattern Recognition | 17 | Candlestick pattern recognition — rule-based detection (I2). |
| [`Peer Valuation`](#peer-valuation) | Other | 1 | Peer Valuation — compares a target company's valuation metrics against a set … |
| [`Percentile Rank`](#percentile-rank) | Other | 3 | Percentile Rank utilities. percentile(values, p) — linear interpolation, p in… |
| [`Performance Attribution`](#performance-attribution) | Other | 1 | Brinson-Fachler Performance Attribution — decomposes portfolio excess return … |
| [`Pivots`](#pivots) | Other | 1 | Floor pivot points: classic, Fibonacci, Camarilla, Woodie variants. Inputs ar… |
| [`Point And Figure`](#point-and-figure) | Chart Types | 3 | Point & Figure (P&F) chart computation. |
| [`Portfolio Analytics`](#portfolio-analytics) | Portfolio & Risk | 6 | Portfolio aggregations: holdings → sector allocation, position weights, top-N… |
| [`Portfolio Benchmark`](#portfolio-benchmark) | Portfolio & Risk | 2 | Portfolio benchmark comparison — compare portfolio returns against a market i… |
| [`Portfolio Rebalance`](#portfolio-rebalance) | Portfolio & Risk | 6 | Portfolio rebalance calculator — compute trades needed to bring a portfolio b… |
| [`Position Risk`](#position-risk) | Portfolio & Risk | 2 | Position-level risk metrics — stop distance, risk percentage, portfolio heat,… |
| [`Position Sizing`](#position-sizing) | Backtesting | 6 | Position sizing helpers — risk-based, fixed-fraction, ATR-based and Kelly cri… |
| [`Ppo`](#ppo) | Oscillators & Momentum | 1 | Percentage Price Oscillator (Gerald Appel). Same logic as MACD but expressed … |
| [`Profit Factor`](#profit-factor) | Other | 2 | Profit factor and trade performance metrics from a list of trades. |
| [`Range Bars`](#range-bars) | Other | 2 | Range bar chart computation. |
| [`Realized Volatility`](#realized-volatility) | Volatility Indicators | 5 | Realized volatility estimators — range-based and tick-based vol measures. Par… |
| [`Regime Switching`](#regime-switching) | Other | 4 | Regime Switching (Hamilton filter) — bull/bear state detection. Implements a … |
| [`Relative Strength`](#relative-strength) | Other | 6 | Relative Strength Comparison domain helpers (H21). |
| [`Relative Volume`](#relative-volume) | Volume Indicators | 2 | Relative Volume (RVOL) — compare current volume to historical average. |
| [`Renko`](#renko) | Other | 2 | Renko chart brick computation. |
| [`Resample`](#resample) | Other | 1 | Resample candles to a coarser timeframe by bucketing on a fixed interval. Inp… |
| [`Returns`](#returns) | Other | 6 | Returns calculations: simple, log, cumulative, and rolling. All functions ass… |
| [`Risk Adjusted Comparison`](#risk-adjusted-comparison) | Portfolio & Risk | 1 | Risk-Adjusted Return Comparison — compare multiple assets on Sharpe, Sortino,… |
| [`Risk Contribution`](#risk-contribution) | Portfolio & Risk | 3 | Risk contribution (Euler decomposition) — marginal and component risk. Decomp… |
| [`Risk Parity`](#risk-parity) | Portfolio & Risk | 5 | Risk parity allocator — compute portfolio weights where each asset contribute… |
| [`Risk Ratios`](#risk-ratios) | Portfolio & Risk | 4 | Risk-adjusted return metrics that complement Sharpe in `backtest-engine.ts`. … |
| [`Risk Reward`](#risk-reward) | Portfolio & Risk | 7 | Risk/reward ratio calculator — evaluate trade setups with entry, stop loss, a… |
| [`Roc`](#roc) | Oscillators & Momentum | 1 | Rate of Change (ROC). Percentage form of momentum: ROC[i] = 100 * (close[i] -… |
| [`Rolling Correlation`](#rolling-correlation) | Statistical Analysis | 1 | Rolling Correlation — sliding-window Pearson correlation between two price se… |
| [`Rolling Sharpe`](#rolling-sharpe) | Other | 1 | Rolling Sharpe Ratio — compute Sharpe ratio over a sliding window. |
| [`Rolling Stats`](#rolling-stats) | Other | 5 | Rolling statistics over a numeric series: mean, sample standard deviation, va… |
| [`Rsi Calculator`](#rsi-calculator) | Other | 2 | RSI Calculator — Pure domain logic. Ported from Dart: lib/src/domain/rsi_calc… |
| [`Rsi Method`](#rsi-method) | Signal Methods | 1 | RSI Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/rsi… |
| [`Sar Method`](#sar-method) | Signal Methods | 1 | Parabolic SAR Method Detector — Pure domain logic. Ported from Dart: lib/src/… |
| [`Screener Fundamentals`](#screener-fundamentals) | Other | 3 | Screener fundamental filters — pure domain logic (Q3). |
| [`Seasonality`](#seasonality) | Other | 2 | Seasonality aggregations: average daily return grouped by month (0–11) or day… |
| [`Sector Allocation`](#sector-allocation) | Other | 6 | Sector allocation calculator — compute sector weightings and concentration me… |
| [`Sector Rotation`](#sector-rotation) | Other | 4 | Sector Rotation domain — relative strength ranking (H20). |
| [`Signal Aggregator`](#signal-aggregator) | Other | 2 | Signal Aggregator — runs all 12 method detectors for a ticker, then feeds res… |
| [`Signal Dsl`](#signal-dsl) | Signal DSL | 4 | Tiny safe expression evaluator for user-authored signal rules. |
| [`Signal Strategy Io`](#signal-strategy-io) | Other | 10 | Shared signal strategy I/O (I6). |
| [`Sma Calculator`](#sma-calculator) | Other | 2 | SMA Calculator — Pure domain logic. Ported from Dart: lib/src/domain/sma_calc… |
| [`Snapshot Diff`](#snapshot-diff) | Volume Indicators | 5 | Data snapshot diffing — compare two point-in-time ticker data snapshots to hi… |
| [`Spectral Density`](#spectral-density) | Other | 3 | Spectral density estimation — periodogram and Welch's method. Identifies domi… |
| [`Standard Deviation`](#standard-deviation) | Other | 1 | Rolling standard deviation over a window of `period` samples. Defaults to pop… |
| [`Stochastic Calculator`](#stochastic-calculator) | Oscillators & Momentum | 2 | Stochastic Oscillator — Pure domain logic. Ported from Dart: lib/src/domain/s… |
| [`Stochastic Method`](#stochastic-method) | Signal Methods | 1 | Stochastic Method Detector — Pure domain logic. Ported from Dart: lib/src/dom… |
| [`Stochastic Rsi`](#stochastic-rsi) | Oscillators & Momentum | 1 | Stochastic RSI (Chande & Kroll). Applies the stochastic oscillator formula to… |
| [`Strategy Comparison`](#strategy-comparison) | Other | 2 | Strategy comparison — run two backtest configurations side-by-side on the sam… |
| [`Streak Tracker`](#streak-tracker) | Other | 7 | Gain/loss streak tracker — analyze consecutive up/down days for streak detect… |
| [`Supertrend Calculator`](#supertrend-calculator) | Trend Indicators | 2 | SuperTrend — Pure domain logic. Ported from Dart: lib/src/domain/supertrend_c… |
| [`Supertrend Method`](#supertrend-method) | Signal Methods | 1 | SuperTrend Method Detector — Pure domain logic. Ported from Dart: lib/src/dom… |
| [`Support Resistance`](#support-resistance) | Other | 6 | Support/resistance level finder — identify key price levels from historical d… |
| [`Tail Index`](#tail-index) | Other | 4 | Tail index estimation (Extreme Value Theory) — Hill estimator, peaks-over-thr… |
| [`Tail Risk`](#tail-risk) | Portfolio & Risk | 5 | Tail risk metrics — CVaR (Conditional Value at Risk) / Expected Shortfall. Me… |
| [`Ticker Catalog`](#ticker-catalog) | Other | 3 | Static ticker catalog — offline fuzzy lookup for the ticker search box. |
| [`Ticker Comparison`](#ticker-comparison) | Other | 5 | Ticker comparison table — side-by-side data comparison for multiple tickers a… |
| [`Time Segmented Volume`](#time-segmented-volume) | Volume Indicators | 1 | Time-Segmented Volume (TSV) — Worden Brothers accumulation/distribution. |
| [`Trade Journal`](#trade-journal) | Other | 1 | Trade Journal Analytics — pure functions to analyze a user's trade log and co… |
| [`Trade Stats`](#trade-stats) | Other | 4 | Trade performance stats — calculate key trading metrics from a history of com… |
| [`Trend Strength`](#trend-strength) | Trend Indicators | 1 | Trend Strength Composite (TSC) — unified 0-100 trend strength score. |
| [`Trix`](#trix) | Other | 1 | TRIX (Jack Hutson, 1980s): rate of change of a triple-smoothed EMA. ema1 = EM… |
| [`Tsi`](#tsi) | Oscillators & Momentum | 1 | True Strength Index (William Blau, 1991). Double-smoothed momentum oscillator… |
| [`Turtle Trading`](#turtle-trading) | Trend Indicators | 3 | Turtle Trading System — Donchian breakout trend-following with position sizin… |
| [`Ulcer Index`](#ulcer-index) | Other | 1 | Ulcer Index (Peter Martin, 1987). Measures depth and duration of drawdowns ov… |
| [`Ultimate Oscillator`](#ultimate-oscillator) | Oscillators & Momentum | 1 | Larry Williams' Ultimate Oscillator. Combines short, medium, and long term bu… |
| [`Validate Ohlcv`](#validate-ohlcv) | Other | 1 | Validate OHLCV quality before prices reach calculations or views. |
| [`Var Backtest`](#var-backtest) | Backtesting | 3 | VaR backtest — Kupiec POF test and Christoffersen independence/conditional co… |
| [`Volatility Adj Momentum`](#volatility-adj-momentum) | Oscillators & Momentum | 1 | Volatility-Adjusted Momentum (VAM) — momentum normalized by ATR. |
| [`Volatility Cone`](#volatility-cone) | Volatility Indicators | 4 | Volatility cone — term structure of realized volatility at different lookback… |
| [`Volatility Rank`](#volatility-rank) | Volatility Indicators | 7 | Volatility rank calculator — compute and rank tickers by historical volatilit… |
| [`Volume Price Trend`](#volume-price-trend) | Oscillators & Momentum | 1 | Volume-Price Trend (VPT) — cumulative volume-weighted price momentum. |
| [`Volume Profile`](#volume-profile) | Volume Indicators | 1 | Volume profile (price-by-volume): bins each candle's volume across its high-l… |
| [`Vortex Indicator`](#vortex-indicator) | Other | 1 | Vortex Indicator (Etienne Botes & Douglas Siepman, 2009). VM+[i] = \|high[i]  … |
| [`Vwap Calculator`](#vwap-calculator) | Volume Indicators | 2 | VWAP Calculator — Volume-Weighted Average Price. Ported from Dart: lib/src/do… |
| [`Vwap`](#vwap) | Volume Indicators | 6 | Volume-weighted price calculations — VWAP and TWAP from intraday price/volume… |
| [`Walk Forward`](#walk-forward) | Other | 2 | Walk-forward analysis — out-of-sample backtest validation. Splits data into i… |
| [`Watchlist Share`](#watchlist-share) | Other | 6 | Collaborative watchlist sharing via URL snapshots (I8). |
| [`Wavelet`](#wavelet) | Other | 5 | Wavelet decomposition — multi-resolution analysis for price series. Uses Haar… |
| [`Williams R Calculator`](#williams-r-calculator) | Other | 2 | Williams %R — Pure domain logic. Ported from Dart: lib/src/domain/williams_pe… |
| [`Williams R Method`](#williams-r-method) | Signal Methods | 1 | Williams %R Method Detector — Pure domain logic. Ported from Dart: lib/src/do… |
| [`Wma`](#wma) | Trend Indicators | 1 | Weighted Moving Average. Linearly weighted: most recent bar has the largest w… |
| [`Zigzag`](#zigzag) | Other | 1 | ZigZag pivot detector. Marks alternating swing highs and swing lows separated… |

---

## 🔔 Alerts

### Alert Proximity

**File:** `src/domain/alert-proximity.ts`

Price alert proximity check — determine how close current prices are to configured alert levels for watchlist overview display.

**Functions:**

| Function | Description |
| --- | --- |
| `calculateProximity()` | Price alert proximity check — determine how close current prices are to configured alert levels for watchlist overview display. |
| `checkAlertProximity()` | Check proximity for a single ticker against a single alert. |
| `checkMultipleAlerts()` | Check proximity for multiple alerts, return sorted by closest first. |
| `getAlertsWithinThreshold()` | Filter alerts that are within a given proximity threshold. |
| `formatProximity()` | Format proximity as a display string. |

**Types:** `AlertProximity`

---

### Alert State Machine

**File:** `src/domain/alert-state-machine.ts`

Alert State Machine — Pure domain logic. Ported from Dart: lib/src/domain/entities.dart (AlertType, TickerAlertState)

**Functions:**

| Function | Description |
| --- | --- |
| `createAlertState()` | Alert State Machine — Pure domain logic. Ported from Dart: lib/src/domain/entities.dart (AlertType, TickerAlertState) |
| `evaluateAlerts()` | Map a MethodSignal to BUY/SELL alert types. */ function methodAlertTypes(method: string): { buy: AlertType; sell: AlertType } \| null { const MAP: Record<string, { buy: AlertType; sell: AlertType }> = { Micho: { buy: "michoMethodBuy", sell: "michoMethodSell" }, RSI: { buy: "rsiMethodBuy", sell: "rsiMethodSell" }, MACD: { buy: "macdMethodBuy", sell: "macdMethodSell" }, Bollinger: { buy: "bollingerMethodBuy", sell: "bollingerMethodSell" }, Stochastic: { buy: "stochasticMethodBuy", sell: "stochasticMethodSell" }, OBV: { buy: "obvMethodBuy", sell: "obvMethodSell" }, ADX: { buy: "adxMethodBuy", sell: "adxMethodSell" }, CCI: { buy: "cciMethodBuy", sell: "cciMethodSell" }, SAR: { buy: "sarMethodBuy", sell: "sarMethodSell" }, WilliamsR: { buy: "williamsRMethodBuy", sell: "williamsRMethodSell" }, MFI: { buy: "mfiMethodBuy", sell: "mfiMethodSell" }, SuperTrend: { buy: "supertrendMethodBuy", sell: "supertrendMethodSell" }, }; return MAP[method] ?? null; } |
| `evaluateMultiConditionRules()` | Check whether a single condition is satisfied by the current signals. */ function checkCondition( condition: AlertCondition, signals: readonly MethodSignal[], consensus: ConsensusResult \| null, ): boolean { if (condition.type === "consensus") { return consensus?.direction === condition.direction; } |

**Types:** `FiredAlert`, `TickerAlertState`, `RuleFiredAlert`

---

## 🔁 Backtesting

### Backtest Engine

**File:** `src/domain/backtest-engine.ts`

Backtest Engine — run method signals against historical candles.

**Functions:**

| Function | Description |
| --- | --- |
| `computeTradeCost()` | Backtest Engine — run method signals against historical candles. |
| `runBacktest()` | Q8: Commission and slippage model. */ readonly commission?: CommissionConfig; /** Q9: Position sizing configuration. Defaults to all-in (percentage 100%). */ readonly sizing?: BacktestSizingConfig; } |

**Types:** `CommissionConfig`, `BacktestConfig`, `BacktestTrade`, `BacktestExplanation`, `BacktestResult`

---

### Backtest Metrics

**File:** `src/domain/backtest-metrics.ts`

Backtest performance metrics. Pure module that converts an equity curve plus trade list into the metrics traders expect to see: total return, CAGR, max drawdown, Sharpe, win rate, profit factor.

**Functions:**

| Function | Description |
| --- | --- |
| `sharpe()` | Backtest performance metrics. Pure module that converts an equity curve plus trade list into the metrics traders expect to see: total return, CAGR, max drawdown, Sharpe, win rate, profit factor. |
| `totalReturn()` | — |
| `cagr()` | — |
| `maxDrawdown()` | — |
| `periodReturns()` | — |
| `winRate()` | — |
| `profitFactor()` | — |
| `computeMetrics()` | — |

**Types:** `EquityPoint`, `Trade`, `BacktestMetrics`

---

### Commission

**File:** `src/domain/commission.ts`

Commission & slippage model for backtesting.

**Functions:**

| Function | Description |
| --- | --- |
| `calculateCommission()` | Commission & slippage model for backtesting. |
| `applySlippage()` | Apply slippage to entry/exit prices. For long trades: entry price increases, exit price decreases. For short trades: entry price decreases, exit price increases. |
| `netTradePnl()` | Calculate net PnL for a trade after commission and slippage. |
| `totalFees()` | Calculate total fees (commission + slippage cost) for a series of trades. |

**Types:** `CommissionConfig`

---

### Pattern Backtest

**File:** `src/domain/pattern-backtest.ts`

Pattern backtesting engine — historical win-rate validation (I3).

**Functions:**

| Function | Description |
| --- | --- |
| `evaluatePatternTrade()` | Pattern backtesting engine — historical win-rate validation (I3). |
| `aggregatePatternStats()` | Aggregate trade results into per-pattern statistics. |
| `backtestPatterns()` | Run a full pattern backtest on historical candle data. |

**Types:** `PatternBacktestConfig`, `PatternTradeResult`, `PatternStats`, `PatternBacktestReport`

---

### Position Sizing

**File:** `src/domain/position-sizing.ts`

Position sizing helpers — risk-based, fixed-fraction, ATR-based and Kelly criterion sizing. Pure math; suitable for the screener and the backtest engine.

**Functions:**

| Function | Description |
| --- | --- |
| `riskBasedSize()` | Position sizing helpers — risk-based, fixed-fraction, ATR-based and Kelly criterion sizing. Pure math; suitable for the screener and the backtest engine. |
| `atrBasedSize()` | ATR multiplier for stop distance. Default 2. */ readonly atrMultiplier?: number; } |
| `fixedFractionalSize()` | Fixed-fractional sizing — invest a fixed fraction of account equity. |
| `kellyFraction()` | Win probability in [0,1]. */ readonly winRate: number; /** Average win amount (positive). */ readonly avgWin: number; /** Average loss amount (positive). */ readonly avgLoss: number; } |
| `halfKellySize()` | "Half-Kelly" sized share count — practical compromise that reduces the variance of full-Kelly sizing. |
| `computeBacktestShares()` | For "fixed" mode: number of shares per trade. */ readonly fixedQuantity?: number; /** For "percentage" mode: fraction of equity (e.g. 0.1 = 10%). */ readonly percentOfEquity?: number; /** For "kelly" mode: Kelly fraction multiplier (e.g. 0.5 = half Kelly). */ readonly kellyMultiplier?: number; } |

**Types:** `RiskBasedSizingInput`, `AtrSizingInput`, `KellyInput`, `BacktestSizingConfig`

---

### Var Backtest

**File:** `src/domain/var-backtest.ts`

VaR backtest — Kupiec POF test and Christoffersen independence/conditional coverage tests. Validates whether a VaR model's violation rate is consistent with its confidence level.

**Functions:**

| Function | Description |
| --- | --- |
| `kupiecTest()` | VaR backtest — Kupiec POF test and Christoffersen independence/conditional coverage tests. Validates whether a VaR model's violation rate is consistent with its confidence level. |
| `christoffersenTest()` | Christoffersen (1998) independence and conditional coverage tests. Tests whether violations are serially independent. |
| `varBacktest()` | Full VaR backtest combining Kupiec and Christoffersen. |

**Types:** `KupiecResult`, `ChristoffersenResult`, `VarBacktestResult`

---

## 📊 Chart Types

### Chart Comparison

**File:** `src/domain/chart-comparison.ts`

Chart comparison — normalizes multiple ticker candle series to percentage change from their respective starting prices.

**Functions:**

| Function | Description |
| --- | --- |
| `normalizeForComparison()` | Chart comparison — normalizes multiple ticker candle series to percentage change from their respective starting prices. |
| `computeComparisonStats()` | — |

**Types:** `ComparisonPoint`, `ComparisonSeries`, `ComparisonStats`

---

### Kagi

**File:** `src/domain/kagi.ts`

Kagi chart computation — Q26.

**Functions:**

| Function | Description |
| --- | --- |
| `autoReversalThreshold()` | Kagi chart computation — Q26. |
| `computeKagi()` | Compute a Kagi chart from a series of closing prices. |

**Types:** `KagiSegment`, `KagiChart`, `KagiOptions`, `KagiInput`

---

### Point And Figure

**File:** `src/domain/point-and-figure.ts`

Point & Figure (P&F) chart computation.

**Functions:**

| Function | Description |
| --- | --- |
| `floorBox()` | Point & Figure (P&F) chart computation. |
| `autoBoxSize()` | Auto-calculate a reasonable box size from the price series. Uses 1% of the median price, snapped to a "nice" number (0.05, 0.1, 0.5, 1, 5, 10, 50, 100). |
| `computePnf()` | Compute a Point & Figure chart from a price series. |

**Types:** `PnfBox`, `PnfColumn`, `PnfChart`, `PnfOptions`, `PnfInput`

---

## 🌊 Oscillators & Momentum

### Aroon

**File:** `src/domain/aroon.ts`

Aroon indicator (Chande, 1995). Measures bars since last N-period high/low. Aroon Up = 100 * (period - barsSinceHigh) / period; Aroon Down likewise for the low. Oscillator = Up - Down.

**Functions:**

| Function | Description |
| --- | --- |
| `computeAroon()` | — |

**Types:** `AroonPoint`

---

### Awesome Oscillator

**File:** `src/domain/awesome-oscillator.ts`

Awesome Oscillator (Bill Williams): AO = SMA(median, fast=5) - SMA(median, slow=34) where median = (H + L) / 2. Bar color: green if rising vs prev AO, red if falling.

**Functions:**

| Function | Description |
| --- | --- |
| `computeAwesomeOscillator()` | — |

**Types:** `AoPoint`

---

### Chaikin Oscillator

**File:** `src/domain/chaikin-oscillator.ts`

Chaikin Oscillator (Marc Chaikin). MACD applied to the Accumulation/Distribution Line: AD     = cumulative sum of MFV ChOsc  = EMA(AD, fast) - EMA(AD, slow)   (typical: 3, 10)

**Functions:**

| Function | Description |
| --- | --- |
| `computeChaikinOscillator()` | — |

---

### Chande Momentum Oscillator

**File:** `src/domain/chande-momentum-oscillator.ts`

Chande Momentum Oscillator (Tushar Chande, 1994). diff[i]   = close[i] - close[i-1] sumUp     = sum of positive diffs over period sumDown   = sum of |negative diffs| over period CMO       = 100 * (sumUp - sumDown) / (sumUp + sumDown), in [-100, 100] Returns null where there isn't enough history.

**Functions:**

| Function | Description |
| --- | --- |
| `computeCmo()` | Chande Momentum Oscillator (Tushar Chande, 1994). diff[i]   = close[i] - close[i-1] sumUp     = sum of positive diffs over period sumDown   = sum of \|negative diffs\| over period CMO       = 100 * (sumUp - sumDown) / (sumUp + sumDown), in [-100, 100] Returns null where there isn't enough history. |

---

### Coppock Curve

**File:** `src/domain/coppock-curve.ts`

Coppock Curve (Edwin Coppock, 1962). Long-term momentum: coppock = WMA( ROC(close, longRoc) + ROC(close, shortRoc), wmaPeriod ) Defaults: longRoc=14, shortRoc=11, wmaPeriod=10 (monthly bars). Crossing above zero is a bullish long-term signal.

**Functions:**

| Function | Description |
| --- | --- |
| `computeCoppockCurve()` | — |

---

### Divergence Detector

**File:** `src/domain/divergence-detector.ts`

Divergence Detector — detect bullish and bearish divergences between price and an oscillator (RSI, MACD histogram, etc.).

**Functions:**

| Function | Description |
| --- | --- |
| `detectDivergences()` | Divergence Detector — detect bullish and bearish divergences between price and an oscillator (RSI, MACD histogram, etc.). |

**Types:** `Divergence`, `DivergenceOptions`

---

### Dpo

**File:** `src/domain/dpo.ts`

Detrended Price Oscillator (DPO). Removes the trend by subtracting a displaced SMA from price: shift = floor(period/2) + 1 DPO[i] = close[i] - SMA(close, period)[i - shift] Useful for identifying overbought/oversold cycles without trend bias. Returns nulls where insufficient history.

**Functions:**

| Function | Description |
| --- | --- |
| `computeDpo()` | Detrended Price Oscillator (DPO). Removes the trend by subtracting a displaced SMA from price: shift = floor(period/2) + 1 DPO[i] = close[i] - SMA(close, period)[i - shift] Useful for identifying overbought/oversold cycles without trend bias. Returns nulls where insufficient history. |

---

### Earnings Surprise

**File:** `src/domain/earnings-surprise.ts`

Earnings surprise tracker — record and analyze actual vs estimated EPS for post-earnings momentum analysis.

**Functions:**

| Function | Description |
| --- | --- |
| `calculateSurprise()` | Earnings surprise tracker — record and analyze actual vs estimated EPS for post-earnings momentum analysis. |
| `batchSurprises()` | Batch calculate surprises for multiple earnings results. |
| `beatRate()` | Get the beat rate (proportion that exceeded estimates). |
| `averageSurprise()` | Get the average surprise percentage. |
| `topBeats()` | Get tickers with the largest positive surprise. |
| `topMisses()` | Get tickers with the largest negative surprise (misses). |
| `beatStreak()` | Get the consecutive beat streak for a ticker. |
| `classifySurprise()` | Classify surprise magnitude. |

**Types:** `EarningsResult`, `EarningsSurprise`

---

### Klinger Oscillator

**File:** `src/domain/klinger-oscillator.ts`

Klinger Volume Oscillator (KVO). Stephen Klinger's volume-based momentum indicator. Computes signed "volume force" and takes the difference of a fast and slow EMA of it. A signal-line EMA can be derived externally.

**Functions:**

| Function | Description |
| --- | --- |
| `computeKlingerOscillator()` | — |

**Types:** `KlingerOptions`, `VolumeCandle`

---

### Momentum Rank

**File:** `src/domain/momentum-rank.ts`

Multi-ticker momentum rank — rank tickers by rate-of-change performance over configurable lookback periods for relative strength comparison.

**Functions:**

| Function | Description |
| --- | --- |
| `rateOfChange()` | Multi-ticker momentum rank — rank tickers by rate-of-change performance over configurable lookback periods for relative strength comparison. |
| `rankByMomentum()` | Rank multiple tickers by their momentum (rate of change). Returns array sorted by strongest momentum first. |
| `compositeMomentum()` | Compute composite momentum across multiple timeframes. Averages ROC over short, medium, and long periods. |
| `rankByCompositeMomentum()` | Rank tickers by composite momentum (multi-timeframe). |
| `getMomentumLeaders()` | Get the top N momentum leaders. |
| `getMomentumLaggards()` | Get the bottom N momentum laggards. |

**Types:** `MomentumRank`

---

### Momentum

**File:** `src/domain/momentum.ts`

Momentum oscillator. Simple price difference over `period` bars: momentum[i] = close[i] - close[i - period] Returns nulls until enough history exists. Output length matches input.

**Functions:**

| Function | Description |
| --- | --- |
| `computeMomentum()` | Momentum oscillator. Simple price difference over `period` bars: momentum[i] = close[i] - close[i - period] Returns nulls until enough history exists. Output length matches input. |

---

### Ppo

**File:** `src/domain/ppo.ts`

Percentage Price Oscillator (Gerald Appel). Same logic as MACD but expressed as a percentage of the slow EMA, so values are comparable across instruments with different price scales. PPO       = 100 * (EMA_fast - EMA_slow) / EMA_slow signal    = EMA(PPO, signalPeriod) histogram = PPO - signal

**Functions:**

| Function | Description |
| --- | --- |
| `computePpo()` | — |

**Types:** `PpoPoint`

---

### Roc

**File:** `src/domain/roc.ts`

Rate of Change (ROC). Percentage form of momentum: ROC[i] = 100 * (close[i] - close[i - period]) / close[i - period] Returns null when previous close is 0 (division by zero).

**Functions:**

| Function | Description |
| --- | --- |
| `computeRoc()` | Rate of Change (ROC). Percentage form of momentum: ROC[i] = 100 * (close[i] - close[i - period]) / close[i - period] Returns null when previous close is 0 (division by zero). |

---

### Stochastic Calculator

**File:** `src/domain/stochastic-calculator.ts`

Stochastic Oscillator — Pure domain logic. Ported from Dart: lib/src/domain/stochastic_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeStochasticSeries()` | — |
| `computeStochastic()` | — |

**Types:** `StochasticPoint`

---

### Stochastic Rsi

**File:** `src/domain/stochastic-rsi.ts`

Stochastic RSI (Chande & Kroll). Applies the stochastic oscillator formula to the RSI series rather than to price: RSI(period) StochRSI = (RSI - min(RSI, stochPeriod)) / (max - min) %K = SMA(StochRSI*100, kSmooth) %D = SMA(%K, dSmooth) Returns values in [0, 100].

**Functions:**

| Function | Description |
| --- | --- |
| `computeStochRsi()` | — |

**Types:** `StochRsiOptions`, `StochRsiPoint`

---

### Tsi

**File:** `src/domain/tsi.ts`

True Strength Index (William Blau, 1991). Double-smoothed momentum oscillator: m       = close[i] - close[i-1] absm    = |m| ema1    = EMA(m, slow) ema2    = EMA(ema1, fast) absEma1 = EMA(absm, slow) absEma2 = EMA(absEma1, fast) TSI     = 100 * ema2 / absEma2 signal  = EMA(TSI, signalPeriod)   (default 7) Output is bounded in [-100, 100].

**Functions:**

| Function | Description |
| --- | --- |
| `computeTsi()` | — |

**Types:** `TsiOptions`, `TsiPoint`

---

### Ultimate Oscillator

**File:** `src/domain/ultimate-oscillator.ts`

Larry Williams' Ultimate Oscillator. Combines short, medium, and long term buying-pressure / true-range averages into a single momentum value scaled 0–100.

**Functions:**

| Function | Description |
| --- | --- |
| `computeUltimateOscillator()` | — |

**Types:** `UltimateOscillatorOptions`

---

### Volatility Adj Momentum

**File:** `src/domain/volatility-adj-momentum.ts`

Volatility-Adjusted Momentum (VAM) — momentum normalized by ATR.

**Functions:**

| Function | Description |
| --- | --- |
| `computeVam()` | Volatility-Adjusted Momentum (VAM) — momentum normalized by ATR. |

**Types:** `VamPoint`, `VamOptions`

---

### Volume Price Trend

**File:** `src/domain/volume-price-trend.ts`

Volume-Price Trend (VPT) — cumulative volume-weighted price momentum.

**Functions:**

| Function | Description |
| --- | --- |
| `computeVpt()` | Volume-Price Trend (VPT) — cumulative volume-weighted price momentum. |

**Types:** `VptPoint`, `VptOptions`

---

## 🗂️ Other

### Adx Calculator

**File:** `src/domain/adx-calculator.ts`

ADX (Average Directional Index) — Pure domain logic. Ported from Dart: lib/src/domain/adx_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeAdxSeries()` | — |
| `computeAdx()` | — |

**Types:** `AdxPoint`

---

### Analytics

**File:** `src/domain/analytics.ts`

Analytics Calculators — Sharpe ratio, Sortino ratio, max drawdown, Fibonacci levels.

**Functions:**

| Function | Description |
| --- | --- |
| `dailyReturns()` | Analytics Calculators — Sharpe ratio, Sortino ratio, max drawdown, Fibonacci levels. |
| `sharpeRatio()` | Compute annualized Sharpe ratio. Sharpe = (mean_return - risk_free_rate) / std_dev * sqrt(252) |
| `sortinoRatio()` | Compute annualized Sortino ratio (penalizes downside deviation only). |
| `maxDrawdown()` | Compute maximum drawdown from a price series. Returns a value between 0 and 1 (e.g. 0.25 = 25% drawdown). |
| `fibonacciRetracement()` | — |

**Types:** `FibonacciLevels`

---

### Bar Replay

**File:** `src/domain/bar-replay.ts`

Bar Replay — step through historical OHLCV candles with play/pause/speed/seek.

**Functions:**

| Function | Description |
| --- | --- |
| `createBarReplay()` | Bar Replay — step through historical OHLCV candles with play/pause/speed/seek. |

**Types:** `ReplayOptions`, `ReplayState`, `BarReplay`

---

### Base64 Url

**File:** `src/domain/base64-url.ts`

URL-safe Base64 encoding/decoding (RFC 4648 §5). Replaces `+` with `-`, `/` with `_`, and strips `=` padding. Works with strings (UTF-8) and `Uint8Array` payloads in any JS runtime that has `atob`/`btoa` or `Buffer`.

**Functions:**

| Function | Description |
| --- | --- |
| `base64UrlEncodeBytes()` | — |
| `base64UrlDecodeBytes()` | — |
| `base64UrlEncode()` | — |
| `base64UrlDecode()` | — |

---

### Benchmark

**File:** `src/domain/benchmark.ts`

Benchmark comparison helpers — compute the normalized "performance vs benchmark" overlay used in Portfolio and Chart cards. Pure math.

**Functions:**

| Function | Description |
| --- | --- |
| `rebaseToHundred()` | Benchmark comparison helpers — compute the normalized "performance vs benchmark" overlay used in Portfolio and Chart cards. Pure math. |
| `compareToBenchmark()` | Align two series on shared timestamps and produce a per-bar comparison. Both inputs must be sorted ascending by timestamp. |
| `beta()` | Beta of subject returns vs benchmark returns (covariance / variance). Returns 0 when inputs are too short or benchmark variance is 0. |

**Types:** `SeriesPoint`, `RelativePoint`

---

### Black Scholes

**File:** `src/domain/black-scholes.ts`

Black-Scholes option pricing model and Greeks. Pure math — no options chain data required.

**Functions:**

| Function | Description |
| --- | --- |
| `blackScholes()` | Black-Scholes option pricing model and Greeks. Pure math — no options chain data required. |
| `callGreeks()` | Calculate option Greeks for a call. |
| `putGreeks()` | Calculate option Greeks for a put. |
| `impliedVolatility()` | Implied volatility via bisection method. |

**Types:** `BlackScholesInput`, `OptionPrice`, `Greeks`

---

### Causal Impact

**File:** `src/domain/causal-impact.ts`

Causal impact analysis — simplified Bayesian structural time series. Estimates the causal effect of an intervention on a time series using a synthetic control approach.

**Functions:**

| Function | Description |
| --- | --- |
| `causalImpact()` | Causal impact analysis — simplified Bayesian structural time series. Estimates the causal effect of an intervention on a time series using a synthetic control approach. |

**Types:** `CausalImpactResult`, `CausalImpactConfig`

---

### Cci Calculator

**File:** `src/domain/cci-calculator.ts`

CCI (Commodity Channel Index) — Pure domain logic. Ported from Dart: lib/src/domain/cci_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeCciSeries()` | — |
| `computeCci()` | — |

**Types:** `CciPoint`

---

### Changepoint Detection

**File:** `src/domain/changepoint-detection.ts`

Bayesian changepoint detection — identifies structural breaks in time series. Uses Bayesian Online Changepoint Detection (BOCPD) algorithm.

**Functions:**

| Function | Description |
| --- | --- |
| `bayesianChangepoints()` | Bayesian changepoint detection — identifies structural breaks in time series. Uses Bayesian Online Changepoint Detection (BOCPD) algorithm. |
| `cusumChangepoints()` | Simple threshold-based changepoint detection (CUSUM-like). Faster alternative for real-time use. |

**Types:** `Changepoint`, `ChangepointResult`

---

### Connors Rsi

**File:** `src/domain/connors-rsi.ts`

Connors RSI (Larry Connors). Composite of three components: 1. RSI(close, rsiPeriod)            — default 3 2. RSI(streak, streakPeriod)        — default 2 (streak = consecutive up/down day count, signed) 3. percentRank(ROC(close, 1), pctRankPeriod) — default 100 CRSI = average of the three. Values in [0, 100].

**Functions:**

| Function | Description |
| --- | --- |
| `computeConnorsRsi()` | — |

---

### Corp Actions

**File:** `src/domain/corp-actions.ts`

Corporate Action Adjustment — pure functions for adjusting OHLCV data for stock splits and cash dividends.

**Functions:**

| Function | Description |
| --- | --- |
| `applySplits()` | Corporate Action Adjustment — pure functions for adjusting OHLCV data for stock splits and cash dividends. |
| `applyDividends()` | Apply dividend adjustment to a sorted (ascending date) OHLCV series. |
| `applyCorpActions()` | Apply all corporate action adjustments in correct order: splits first, then dividends (dividends are expressed in split-adjusted terms). |
| `cumulativeSplitFactor()` | Compute the cumulative split factor for a series of splits. |

**Types:** `SplitEvent`, `DividendEvent`, `AdjustmentOptions`

---

### Cross Up Detector

**File:** `src/domain/cross-up-detector.ts`

Cross-Up Detector — Pure domain logic. Ported from Dart: lib/src/domain/cross_up_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `detectCrossUp()` | Cross-Up Detector — Pure domain logic. Ported from Dart: lib/src/domain/cross_up_detector.dart |

**Types:** `CrossUpResult`

---

### Custom Index

**File:** `src/domain/custom-index.ts`

Custom index builder — create equal-weighted or cap-weighted custom indices from a basket of assets.

**Functions:**

| Function | Description |
| --- | --- |
| `equalWeightedIndex()` | Custom index builder — create equal-weighted or cap-weighted custom indices from a basket of assets. |
| `capWeightedIndex()` | Build a market-cap-weighted custom index. |
| `rebalanceWeights()` | Compute daily returns from index values. |

**Types:** `IndexComponent`, `IndexResult`

---

### Dca Simulator

**File:** `src/domain/dca-simulator.ts`

Dollar-cost average (DCA) simulator — model recurring investments and calculate average cost basis, total shares, and performance.

**Functions:**

| Function | Description |
| --- | --- |
| `simulateDca()` | Dollar-cost average (DCA) simulator — model recurring investments and calculate average cost basis, total shares, and performance. |
| `generateDcaSchedule()` | Generate a DCA schedule from a price history with fixed amount. |
| `dcaVsLumpSum()` | Compare DCA vs lump-sum investment. |
| `runningCostBasis()` | Calculate the cost basis at each investment point (running average). |

**Types:** `DcaInvestment`, `DcaResult`

---

### Ddm

**File:** `src/domain/ddm.ts`

Dividend Discount Model (DDM) — intrinsic value estimation. Implements Gordon Growth Model and multi-stage DDM.

**Functions:**

| Function | Description |
| --- | --- |
| `gordonGrowthModel()` | Dividend Discount Model (DDM) — intrinsic value estimation. Implements Gordon Growth Model and multi-stage DDM. |
| `twoStageDDM()` | Two-stage DDM: high growth for N years, then terminal perpetuity. |
| `hModelDDM()` | H-Model: smooth transition from high to stable growth. P = D0 * (1+g_l) / (r - g_l) + D0 * H * (g_s - g_l) / (r - g_l) where H = half-life of high-growth period. |
| `impliedGrowthRate()` | Implied growth rate from current price and dividend. Solves P = D1 / (r - g) for g. |
| `ddmAnalysis()` | Full DDM analysis given current price. |

**Types:** `DDMResult`

---

### Dispersion Trading

**File:** `src/domain/dispersion-trading.ts`

Dispersion trading — index vol vs constituent vol, implied correlation. Exploits difference between index implied vol and weighted constituent vols.

**Functions:**

| Function | Description |
| --- | --- |
| `impliedCorrelation()` | Dispersion trading — index vol vs constituent vol, implied correlation. Exploits difference between index implied vol and weighted constituent vols. |
| `realizedCorrelation()` | Calculate realized correlation from constituent return series. |
| `dispersionAnalysis()` | Full dispersion trading analysis. |
| `indexVarianceFromConstituents()` | Compute index variance from constituent weights and correlation matrix. Used for "fair value" of index vol. |

**Types:** `DispersionMetrics`, `ConstituentData`

---

### Distribution Fit

**File:** `src/domain/distribution-fit.ts`

Distribution fitting tests — Kolmogorov-Smirnov and Anderson-Darling. Goodness-of-fit tests for empirical distributions.

**Functions:**

| Function | Description |
| --- | --- |
| `kolmogorovSmirnov()` | Distribution fitting tests — Kolmogorov-Smirnov and Anderson-Darling. Goodness-of-fit tests for empirical distributions. |
| `andersonDarling()` | Anderson-Darling test: weighted KS statistic emphasizing tails. |
| `normalCdf()` | Standard normal CDF using rational approximation (Abramowitz & Stegun). |
| `normalityTest()` | Test whether sample is normally distributed. |
| `exponentialTest()` | Test whether sample follows an exponential distribution. |

**Types:** `GoodnessOfFitResult`

---

### Dividend Analytics

**File:** `src/domain/dividend-analytics.ts`

Dividend Analytics — pure functions for analyzing dividend history: yield calculation, growth rate (CAGR), payout consistency, and DRIP (Dividend Reinvestment Plan) simulation.

**Functions:**

| Function | Description |
| --- | --- |
| `computeDividendSummary()` | Dividend Analytics — pure functions for analyzing dividend history: yield calculation, growth rate (CAGR), payout consistency, and DRIP (Dividend Reinvestment Plan) simulation. |
| `simulateDrip()` | Simulate Dividend Reinvestment Plan (DRIP). |

**Types:** `DividendPayment`, `DividendSummary`, `DripResult`

---

### Dividend Calendar

**File:** `src/domain/dividend-calendar.ts`

Dividend calendar planner — track ex-dividend dates, payment schedules, and projected annual income from holdings.

**Functions:**

| Function | Description |
| --- | --- |
| `projectIncome()` | Dividend calendar planner — track ex-dividend dates, payment schedules, and projected annual income from holdings. |
| `totalAnnualIncome()` | Get total projected annual dividend income. |
| `monthlyBreakdown()` | Get monthly income breakdown from dividend entries. |
| `upcomingExDates()` | Get upcoming ex-dividend dates within N days. |
| `dividendYield()` | Calculate dividend yield given price and annual dividend. |

**Types:** `DividendEntry`, `DividendProjection`, `MonthlyBreakdown`

---

### Donchian

**File:** `src/domain/donchian.ts`

Donchian channels: highest-high and lowest-low over a lookback window, used by the Turtle trading rules and breakout systems.

**Functions:**

| Function | Description |
| --- | --- |
| `computeDonchian()` | — |

**Types:** `DonchianPoint`

---

### Drawdown Analyzer

**File:** `src/domain/drawdown-analyzer.ts`

Drawdown analyzer — compute peak-to-trough drawdowns from an equity curve or price series for risk assessment.

**Functions:**

| Function | Description |
| --- | --- |
| `drawdownSeries()` | Drawdown analyzer — compute peak-to-trough drawdowns from an equity curve or price series for risk assessment. |
| `findDrawdownPeriods()` | Identify all drawdown periods from a value series. |
| `drawdownSummary()` | Get a summary of drawdown characteristics. |
| `worstDrawdowns()` | Get the worst N drawdowns. |
| `timeUnderwater()` | Calculate time underwater (bars since last peak). |

**Types:** `DrawdownPeriod`, `DrawdownSummary`

---

### Drawdown Recovery

**File:** `src/domain/drawdown-recovery.ts`

Drawdown recovery analysis — estimate recovery patterns, speeds, and probabilities from historical drawdown data.

**Functions:**

| Function | Description |
| --- | --- |
| `analyzeRecoveries()` | Drawdown recovery analysis — estimate recovery patterns, speeds, and probabilities from historical drawdown data. |
| `estimateRecoveryTime()` | Estimate expected recovery time for a given drawdown depth, based on historical recovery patterns. |

**Types:** `RecoveryEvent`, `RecoveryAnalysis`

---

### Earnings Calendar

**File:** `src/domain/earnings-calendar.ts`

Earnings Calendar domain — pure types and transforms (H18).

**Functions:**

| Function | Description |
| --- | --- |
| `parseEarningsResponse()` | Earnings Calendar domain — pure types and transforms (H18). |
| `sortByDate()` | Sort earnings entries by date ascending (earliest first). Preserves stable order for same-date entries. |
| `filterUpcoming()` | Return entries with earningsDate within the next `days` calendar days from `now`. Includes today (diffDays = 0) through `days` days ahead. |
| `getDaysUntilEarnings()` | How many calendar days until this earnings event. Returns 0 for today, negative for past events. |
| `classifySurprise()` | Classify an earnings surprise as "beat", "miss", or "inline". "inline" means \|surprisePct\| <= threshold (default 2%). |

**Types:** `EarningsEntry`, `RawEarningsItem`

---

### Economic Calendar

**File:** `src/domain/economic-calendar.ts`

Economic calendar domain helpers (I10).

**Functions:**

| Function | Description |
| --- | --- |
| `parseEconEvent()` | Economic calendar domain helpers (I10). |
| `filterByImpact()` | Keep events with impact ≥ minImpact. |
| `filterByCountry()` | Keep events matching a specific country code (case-insensitive). |
| `filterByDateRange()` | Keep events within a date range [from, to] (epoch ms, inclusive). |
| `groupByDate()` | Group events by date string (YYYY-MM-DD). |
| `groupByCountry()` | Group events by country code. |
| `nextEvent()` | Find the nearest future event from `now` (epoch ms). Events must be sorted by dateTime ascending for optimal performance, but this performs a full scan for safety. |
| `classifyImpact()` | Heuristic impact classification from event title. |
| `classifyCategory()` | Heuristic category classification from event title. |
| `formatSurprise()` | Classify the direction of the surprise. |
| `surprisePct()` | Percentage surprise relative to forecast. Returns 0 for missing data. |
| `isMarketMoving()` | True if this is a high-impact event with a meaningful surprise. |

**Types:** `EconEvent`, `RawEconEvent`

---

### Efficiency Ratio

**File:** `src/domain/efficiency-ratio.ts`

Kaufman Efficiency Ratio (ER) — measures how efficiently price moves in a given direction relative to total path distance.

**Functions:**

| Function | Description |
| --- | --- |
| `computeEfficiencyRatio()` | Kaufman Efficiency Ratio (ER) — measures how efficiently price moves in a given direction relative to total path distance. |

**Types:** `EfficiencyRatioPoint`, `EfficiencyRatioOptions`

---

### Efficient Frontier

**File:** `src/domain/efficient-frontier.ts`

Efficient frontier — Markowitz mean-variance portfolio optimization. Finds optimal asset allocations that maximize return for a given risk.

**Functions:**

| Function | Description |
| --- | --- |
| `assetStatsFromReturns()` | Efficient frontier — Markowitz mean-variance portfolio optimization. Finds optimal asset allocations that maximize return for a given risk. |
| `covarianceMatrix()` | Compute covariance matrix from daily return series. Each element [i][j] is the annualized covariance between asset i and j. |
| `portfolioVolatility()` | Portfolio volatility given weights and covariance matrix. σ_p = sqrt(w' * Σ * w) |
| `portfolioReturn()` | Portfolio expected return given weights and per-asset returns. |
| `efficientFrontier()` | Generate random portfolio weights that sum to 1 (long-only). |

**Types:** `AssetStats`, `PortfolioPoint`

---

### Elder Impulse

**File:** `src/domain/elder-impulse.ts`

Elder Impulse System (Alexander Elder, "Come Into My Trading Room"). Combines EMA slope and MACD histogram slope into a discrete signal: - GREEN  = EMA slope rising AND MACD histogram rising - RED    = EMA slope falling AND MACD histogram falling - BLUE   = anything else (mixed) Returns nulls until both EMA(13) and MACD histogram are defined for two consecutive bars.

**Functions:**

| Function | Description |
| --- | --- |
| `computeElderImpulse()` | — |

**Types:** `ElderImpulseOptions`

---

### Elder Ray

**File:** `src/domain/elder-ray.ts`

Elder Ray (Alexander Elder, 1989). Measures bull/bear pressure relative to an EMA of close: bullPower = high - EMA(close, period) bearPower = low  - EMA(close, period) Default period = 13.

**Functions:**

| Function | Description |
| --- | --- |
| `computeElderRay()` | — |

**Types:** `ElderRayPoint`

---

### Ema Calculator

**File:** `src/domain/ema-calculator.ts`

EMA Calculator — Pure domain logic. Ported from Dart: lib/src/domain/ema_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeEmaSeries()` | EMA Calculator — Pure domain logic. Ported from Dart: lib/src/domain/ema_calculator.dart |
| `computeEma()` | Compute the current (latest) EMA value. Returns null if insufficient data. |

**Types:** `EmaPoint`

---

### Entropy

**File:** `src/domain/entropy.ts`

Entropy analysis — measures disorder/randomness in time series. Higher entropy = more random/unpredictable, lower = more ordered/predictable.

**Functions:**

| Function | Description |
| --- | --- |
| `shannonEntropy()` | Entropy analysis — measures disorder/randomness in time series. Higher entropy = more random/unpredictable, lower = more ordered/predictable. |
| `normalizedEntropy()` | Normalized Shannon entropy in [0, 1]. 0 = perfectly ordered, 1 = maximum disorder. |
| `permutationEntropy()` | Permutation entropy (Bandt-Pompe). Embeds the time series in vectors of length `order` and counts ordinal patterns. Captures temporal structure independent of distribution. |
| `normalizedPermutationEntropy()` | Normalized permutation entropy in [0, 1]. |
| `sampleEntropy()` | Sample entropy — measures complexity/regularity without self-matches. Lower values indicate more self-similarity/predictability. |
| `interpretEntropy()` | Interpret entropy level as market state. |

---

### Equity Curve

**File:** `src/domain/equity-curve.ts`

Build an equity curve from a list of closed trades, optionally compounding on a starting balance. Each trade has an entry/exit time, entry/exit price, and direction.

**Functions:**

| Function | Description |
| --- | --- |
| `buildEquityCurve()` | Build an equity curve from a list of closed trades, optionally compounding on a starting balance. Each trade has an entry/exit time, entry/exit price, and direction. |
| `tradePnl()` | — |
| `summarizeTrades()` | — |

**Types:** `ClosedTrade`, `EquityPoint`, `CurveStats`

---

### Etf Drilldown

**File:** `src/domain/etf-drilldown.ts`

ETF Constituent Drilldown domain (G18).

**Functions:**

| Function | Description |
| --- | --- |
| `buildEtfDrilldown()` | ETF Constituent Drilldown domain (G18). |
| `topHoldingsByWeight()` | Return the top `n` holdings by portfolio weight (largest first). Already sorted in `EtfDrilldownResult.entries` but this provides a convenient slice API. |
| `topHoldersByContribution()` | Return the top `n` holdings by absolute weighted contribution (most impactful first, regardless of sign). |
| `positiveContributors()` | Return holdings with a positive weighted contribution, sorted by contribution descending. |
| `negativeContributors()` | Return holdings with a negative weighted contribution, sorted by contribution ascending (worst drag first). |

**Types:** `EtfHolding`, `EtfDrilldownEntry`, `EtfDrilldownResult`

---

### Factor Model

**File:** `src/domain/factor-model.ts`

Fama-French factor model — multi-factor attribution for portfolio returns. 3-factor: R - Rf = α + β_mkt(Rm-Rf) + β_smb·SMB + β_hml·HML + ε

**Functions:**

| Function | Description |
| --- | --- |
| `famaFrench3Factor()` | Fama-French factor model — multi-factor attribution for portfolio returns. 3-factor: R - Rf = α + β_mkt(Rm-Rf) + β_smb·SMB + β_hml·HML + ε |
| `factorAttribution()` | Decompose returns into factor contributions. |
| `capmBeta()` | Single-factor CAPM beta (convenience function). |

**Types:** `FactorExposures`, `FactorAttribution`

---

### Fibonacci

**File:** `src/domain/fibonacci.ts`

Fibonacci retracement & extension calculator — compute key Fibonacci levels from swing high/low points.

**Functions:**

| Function | Description |
| --- | --- |
| `fibRetracements()` | Fibonacci retracement & extension calculator — compute key Fibonacci levels from swing high/low points. |
| `fibExtensions()` | Compute Fibonacci extension levels beyond the swing range. |
| `fibAnalysis()` | Full Fibonacci analysis (retracements + extensions). |
| `nearestFibLevel()` | Find the nearest Fibonacci level to a given price. |
| `autoFib()` | Auto-detect swing high/low from a price array and compute fibs. |

**Types:** `FibLevel`, `FibResult`

---

### Fisher Transform

**File:** `src/domain/fisher-transform.ts`

Fisher Transform (John Ehlers, 2002). Applied to the median price, normalised over a `period` lookback into [-1, 1], then inverse-Fisher transformed into a near-Gaussian series. Crossover with prior bar is the standard signal.

**Functions:**

| Function | Description |
| --- | --- |
| `computeFisherTransform()` | — |

**Types:** `FisherPoint`

---

### Fourier Cycles

**File:** `src/domain/fourier-cycles.ts`

Fourier cycle analysis — Discrete Fourier Transform for detecting dominant cycles in price data.

**Functions:**

| Function | Description |
| --- | --- |
| `dft()` | Fourier cycle analysis — Discrete Fourier Transform for detecting dominant cycles in price data. |
| `dominantCycles()` | Find the dominant cycle periods (top N by power). |
| `spectralDensity()` | Spectral density: power at each frequency. Returns array of { period, power } sorted by period ascending. |
| `reconstructSignal()` | Reconstruct signal from top N Fourier components. Useful for visualizing the dominant cycle overlay on price. |
| `cyclePhaseEstimate()` | Estimate the current cycle phase (0-1, where 0=trough, 0.5=peak). |

**Types:** `FourierComponent`

---

### Fractals

**File:** `src/domain/fractals.ts`

Bill Williams Fractals. A bullish fractal forms at index `i` when the low at `i` is strictly lower than the surrounding `n` lows on both sides; a bearish fractal forms when the high at `i` is strictly higher than its `n` neighbors. Default `n = 2` (5-bar pattern).

**Functions:**

| Function | Description |
| --- | --- |
| `computeFractals()` | — |

**Types:** `FractalPoint`

---

### Gap Scanner

**File:** `src/domain/gap-scanner.ts`

Gap detection scanner — identify price gaps (open vs prev close) for gap-fill trading strategies.

**Functions:**

| Function | Description |
| --- | --- |
| `detectGaps()` | Gap detection scanner — identify price gaps (open vs prev close) for gap-fill trading strategies. |
| `unfilledGaps()` | Get only unfilled gaps (potential future fill targets). |
| `gapUps()` | Get gap-up events only. |
| `gapDowns()` | Get gap-down events only. |
| `gapFillRate()` | Calculate the gap fill rate (% of gaps that get filled same day). |
| `largestGaps()` | Get the largest gaps by percentage. |
| `averageGapSize()` | Get average gap size as percentage. |
| `hasRecentGap()` | Detect if a gap occurred on the most recent day. |

**Types:** `DayData`, `Gap`

---

### Granger Causality

**File:** `src/domain/granger-causality.ts`

Granger causality — test whether one time series helps predict another. Uses VAR(p) model and F-test for restricted vs unrestricted regression.

**Functions:**

| Function | Description |
| --- | --- |
| `grangerCausality()` | Granger causality — test whether one time series helps predict another. Uses VAR(p) model and F-test for restricted vs unrestricted regression. |
| `bidirectionalGranger()` | Test bidirectional Granger causality between two series. |
| `selectLagOrder()` | Select optimal lag order using BIC (Bayesian Information Criterion). |

**Types:** `GrangerResult`, `BidirectionalGranger`

---

### Heatmap Drilldown

**File:** `src/domain/heatmap-drilldown.ts`

Heatmap Sector Drill-down domain helpers (G21).

**Functions:**

| Function | Description |
| --- | --- |
| `computeAbsoluteMove()` | Heatmap Sector Drill-down domain helpers (G21). |
| `buildDrilldownEntries()` | Build drill-down entries from a list of constituent stocks. |
| `sortDrilldown()` | Sort drill-down entries by the given key. |
| `buildBreadcrumb()` | Build the breadcrumb for a sector drill-down. |
| `buildDrilldown()` | Full drill-down result for a sector. |
| `computeAttributionBar()` | Produce a flat attribution bar: array of (ticker, fraction) sorted by attribution descending, ready to render as a stacked horizontal bar. |

**Types:** `DrilldownEntry`, `DrilldownResult`

---

### Heikin Ashi

**File:** `src/domain/heikin-ashi.ts`

Heikin-Ashi candle transform. Smooths price action by replacing each OHLC bar with a derived bar: HA close  = (O + H + L + C) / 4 HA open   = (prev HA open + prev HA close) / 2  (seed = (O0 + C0) / 2) HA high   = max(H, HA open, HA close) HA low    = min(L, HA open, HA close)

**Functions:**

| Function | Description |
| --- | --- |
| `heikinAshi()` | — |

**Types:** `Candle`, `HeikinAshiCandle`

---

### Ichimoku

**File:** `src/domain/ichimoku.ts`

Ichimoku Kinko Hyo — five line indicator. Standard parameters (9/26/52) shift Senkou A and B forward by 26 bars and Chikou back by 26 bars.

**Functions:**

| Function | Description |
| --- | --- |
| `computeIchimoku()` | — |

**Types:** `IchimokuPoint`, `IchimokuOptions`

---

### Indicator Config

**File:** `src/domain/indicator-config.ts`

Indicator configuration schema — per-indicator period/threshold/color (Q4 / RF9).

**Functions:**

| Function | Description |
| --- | --- |
| `validateIndicatorConfig()` | Indicator configuration schema — per-indicator period/threshold/color (Q4 / RF9). |

**Types:** `IndicatorConfigBase`, `SmaConfig`, `EmaConfig`, `RsiConfig`, `MacdConfig`, `BollingerConfig`, `StochasticConfig`, `AdxConfig`, `AtrConfig`, `VwapConfig`, `ConfigValidationResult`

---

### Information Ratio

**File:** `src/domain/information-ratio.ts`

Information ratio and related performance metrics. Measures risk-adjusted excess return relative to a benchmark.

**Functions:**

| Function | Description |
| --- | --- |
| `informationRatio()` | Information ratio and related performance metrics. Measures risk-adjusted excess return relative to a benchmark. |
| `trackingError()` | Tracking error — annualized standard deviation of excess returns. |
| `activeReturn()` | Active return — annualized excess return over benchmark. |
| `treynorRatio()` | Treynor ratio = (R_portfolio - R_f) / Beta Measures excess return per unit of systematic risk. |
| `computeBeta()` | Compute beta (systematic risk) of portfolio relative to benchmark. |
| `mSquared()` | M-squared (Modigliani-Modigliani) measure. Adjusts portfolio return to benchmark risk level. |
| `performanceAttribution()` | Full performance attribution summary. |

---

### Insider Transactions

**File:** `src/domain/insider-transactions.ts`

Insider Transactions Analysis — pure functions to analyze insider buying/selling activity and compute sentiment metrics.

**Functions:**

| Function | Description |
| --- | --- |
| `analyzeInsiderTransactions()` | Insider Transactions Analysis — pure functions to analyze insider buying/selling activity and compute sentiment metrics. |

**Types:** `InsiderTransaction`, `InsiderSentiment`

---

### Intraday Range

**File:** `src/domain/intraday-range.ts`

Intraday high/low distance — calculate how far the current price is from the day's high and low, useful for timing entries.

**Functions:**

| Function | Description |
| --- | --- |
| `calculateRangeDistance()` | Intraday high/low distance — calculate how far the current price is from the day's high and low, useful for timing entries. |
| `batchRangeDistance()` | Batch calculate range distances for multiple tickers. |
| `nearHigh()` | Get tickers near their intraday high (position > threshold). |
| `nearLow()` | Get tickers near their intraday low (position < threshold). |
| `widestRange()` | Get tickers with the widest intraday range (most volatile today). |
| `narrowestRange()` | Get tickers with the narrowest intraday range (consolidating). |
| `averagePositionInRange()` | Average True Range position across a list — market-level indicator. |

**Types:** `IntradayRange`, `RangeDistance`

---

### Jump Diffusion

**File:** `src/domain/jump-diffusion.ts`

Merton Jump Diffusion model — extends geometric Brownian motion with Poisson jumps. Models: dS/S = (μ - λk)dt + σ dW + J dN Where N is Poisson process with intensity λ, J is log-normal jump size.

**Functions:**

| Function | Description |
| --- | --- |
| `estimateJumpDiffusion()` | Merton Jump Diffusion model — extends geometric Brownian motion with Poisson jumps. Models: dS/S = (μ - λk)dt + σ dW + J dN Where N is Poisson process with intensity λ, J is log-normal jump size. |
| `mertonCallPrice()` | Merton jump-diffusion call option price (series approximation). Extends Black-Scholes with Poisson-weighted sum. |
| `detectJumps()` | Detect jump events in a return series. |

**Types:** `JumpDiffusionParams`, `JumpDiffusionResult`

---

### Kelly Criterion

**File:** `src/domain/kelly-criterion.ts`

Kelly criterion calculator — determine optimal position sizing based on win rate and win/loss ratio.

**Functions:**

| Function | Description |
| --- | --- |
| `kellyFraction()` | Kelly criterion calculator — determine optimal position sizing based on win rate and win/loss ratio. |
| `kellyAnalysis()` | Full Kelly analysis from trade statistics. |
| `kellyFromTrades()` | Calculate Kelly from a series of trade P&Ls. |
| `kellyPositionSize()` | Calculate optimal position size in currency for a given account. |

**Types:** `KellyInput`, `KellyResult`

---

### Kst

**File:** `src/domain/kst.ts`

Know Sure Thing (Martin Pring, 1992). Smoothed weighted sum of four rate-of-change values: ROC1 = SMA(ROC(close, 10), 10) ROC2 = SMA(ROC(close, 15), 10) ROC3 = SMA(ROC(close, 20), 10) ROC4 = SMA(ROC(close, 30), 15) KST  = ROC1*1 + ROC2*2 + ROC3*3 + ROC4*4 signal = SMA(KST, 9)

**Functions:**

| Function | Description |
| --- | --- |
| `computeKst()` | — |

**Types:** `KstOptions`, `KstPoint`

---

### Linear Regression

**File:** `src/domain/linear-regression.ts`

Ordinary least squares linear regression on (x, y) pairs and a convenience for time-series values (uses index as x). Returns slope, intercept, r² and a function to predict y for any x.

**Functions:**

| Function | Description |
| --- | --- |
| `regressionLine()` | Ordinary least squares linear regression on (x, y) pairs and a convenience for time-series values (uses index as x). Returns slope, intercept, r² and a function to predict y for any x. |
| `regressionChannel()` | Trend channel: regression line ± k standard deviations of residuals. |
| `linearRegression()` | — |

**Types:** `LinearRegression`

---

### Liquidity Metrics

**File:** `src/domain/liquidity-metrics.ts`

Liquidity metrics — measures of market liquidity and trading costs. Includes Amihud illiquidity, bid-ask spread estimators, turnover ratio.

**Functions:**

| Function | Description |
| --- | --- |
| `amihudIlliquidity()` | Liquidity metrics — measures of market liquidity and trading costs. Includes Amihud illiquidity, bid-ask spread estimators, turnover ratio. |
| `rollSpread()` | Roll (1984) effective spread estimator from serial covariance of price changes. Spread = 2 * sqrt(-Cov(ΔP_t, ΔP_{t-1})) if covariance is negative. |
| `turnoverRatio()` | Turnover ratio: total volume traded / shares outstanding. Higher = more liquid. |
| `kyleLambda()` | Kyle's lambda — price impact coefficient. Estimated as slope of regression: ΔP = λ * signed_volume + ε. Uses absolute volume with return sign as proxy for order flow. |
| `liquidityScore()` | Volume-weighted average liquidity score (composite). Normalizes Amihud to [0, 1] scale where 1 = most liquid. |
| `liquidityAnalysis()` | Full liquidity analysis. |

**Types:** `LiquidityMetrics`

---

### Ma Crossover

**File:** `src/domain/ma-crossover.ts`

Moving-average crossover detector. Given two pre-computed series (typically fast SMA/EMA over slow SMA/EMA), emits crossover events with type "golden" (fast crosses above slow) or "death" (below). The two series are aligned by index and may contain leading nulls (warm-up period); only paired non-null bars are considered.

**Functions:**

| Function | Description |
| --- | --- |
| `crossoverFlags()` | Moving-average crossover detector. Given two pre-computed series (typically fast SMA/EMA over slow SMA/EMA), emits crossover events with type "golden" (fast crosses above slow) or "death" (below). The two series are aligned by index and may contain leading nulls (warm-up period); only paired non-null bars are considered. |
| `detectMaCrossovers()` | — |

**Types:** `MaCrossEvent`

---

### Macd Calculator

**File:** `src/domain/macd-calculator.ts`

MACD Calculator — Pure domain logic. Ported from Dart: lib/src/domain/macd_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeMacdSeries()` | MACD Calculator — Pure domain logic. Ported from Dart: lib/src/domain/macd_calculator.dart |

**Types:** `MacdPoint`

---

### Macro Dashboard

**File:** `src/domain/macro-dashboard.ts`

Macro Dashboard domain — pure regime classification and formatters (H19).

**Functions:**

| Function | Description |
| --- | --- |
| `getMacroTicker()` | Macro Dashboard domain — pure regime classification and formatters (H19). |
| `classifyMacroRegime()` | Classify the macro regime from VIX level and DXY day-over-day change. |
| `classifyMacroRegimeExtended()` | Extended regime classification that also factors in the 10-year yield. A sharp rise in yields (> +2% on the day) upgrades any neutral to risk-off. |
| `formatMacroChange()` | Format a percentage change for display. Prepends "+" for positives, fixed to `decimals` places. |
| `regimeLabel()` | Human-readable regime label for display. |
| `regimeCssClass()` | CSS class suffix for coloring regime badges. Consumers apply "badge--risk-on" \| "badge--risk-off" \| "badge--neutral". |

**Types:** `MacroTicker`, `MacroSnapshot`

---

### Market Breadth

**File:** `src/domain/market-breadth.ts`

Market Breadth domain — pure computation layer (G23).

**Functions:**

| Function | Description |
| --- | --- |
| `computeMarketBreadth()` | Market Breadth domain — pure computation layer (G23). |
| `classifyBreadthCondition()` | Classify the overall breadth condition based on computed stats. |

**Types:** `BreadthTicker`, `BreadthResult`

---

### Market Hours

**File:** `src/domain/market-hours.ts`

Market-hours detection for WebSocket connection gating (R24).

**Functions:**

| Function | Description |
| --- | --- |
| `isMarketOpen()` | Market-hours detection for WebSocket connection gating (R24). |
| `marketStatus()` | Get detailed market status for an exchange. |
| `allMarketStatuses()` | Get all exchanges and their open/closed status. |
| `isAnyMarketOpen()` | Check if ANY market is currently open. |
| `openExchanges()` | Get list of currently open exchanges. |
| `shouldConnectWs()` | Determine whether to gate (block) a WS connection based on market hours. Returns true if connection should be allowed. |

**Types:** `MarketSchedule`, `MarketStatus`

---

### Market Impact

**File:** `src/domain/market-impact.ts`

Market impact model (Almgren-Chriss) — optimal execution with price impact. Estimates expected cost of executing a large order over time.

**Functions:**

| Function | Description |
| --- | --- |
| `optimalExecution()` | Market impact model (Almgren-Chriss) — optimal execution with price impact. Estimates expected cost of executing a large order over time. |
| `squareRootImpact()` | Permanent impact cost: γ * X² / 2 |
| `vwapParticipation()` | VWAP participation rate to achieve target time. |

**Types:** `MarketImpactParams`, `ExecutionSchedule`

---

### Market Regime

**File:** `src/domain/market-regime.ts`

Market regime detection (I9).

**Functions:**

| Function | Description |
| --- | --- |
| `classifyVix()` | Market regime detection (I9). |
| `classifyBreadth()` | Classify from advance/decline ratio. - > 1.5  → RiskOn - 0.8–1.5 → Neutral - 0.4–0.8 → RiskOff - < 0.4  → Crisis |
| `classifyYieldCurve()` | Classify from 2y–10y spread (basis points). - spread > 100  → RiskOn - 0–100         → Neutral - -50–0         → RiskOff - < -50         → Crisis |
| `classifyDollar()` | Classify from DXY percentage change (trailing 20-day). A strengthening dollar is typically risk-off for equities. - pctChg < -2  → RiskOn  (dollar weakening) - -2 to +2     → Neutral - +2 to +5     → RiskOff (dollar strengthening) - > +5         → Crisis  (flight to safety) |
| `trendRegime()` | Classify regime from recent price trend using simple momentum. Compares current price to the simple moving average over `span` periods. |
| `volatilityRegime()` | Classify regime from realised volatility of daily returns. |
| `combinedRegime()` | Combine multiple regime signals via weighted majority vote. Falls back to Neutral when signals are empty. |
| `regimeScore()` | Compute a numeric risk score from 0 (max risk-on) to 100 (max crisis). |
| `regimeLabel()` | Human-readable label for a regime. |
| `regimeColor()` | CSS colour token for a regime. |

**Types:** `RegimeSignal`

---

### Max Diversification

**File:** `src/domain/max-diversification.ts`

Maximum Diversification Portfolio — weights that maximize the diversification ratio.

**Functions:**

| Function | Description |
| --- | --- |
| `maxDiversification()` | Maximum Diversification Portfolio — weights that maximize the diversification ratio. |

**Types:** `MaxDivResult`

---

### Mfe Mae

**File:** `src/domain/mfe-mae.ts`

MFE/MAE Analysis — Max Favorable Excursion / Max Adverse Excursion.

**Functions:**

| Function | Description |
| --- | --- |
| `computeExcursions()` | MFE/MAE Analysis — Max Favorable Excursion / Max Adverse Excursion. |

**Types:** `TradeExcursion`, `ExcursionTrade`, `ExcursionSummary`

---

### Monte Carlo

**File:** `src/domain/monte-carlo.ts`

Monte Carlo simulation — generate random portfolio outcome scenarios using historical return distributions.

**Functions:**

| Function | Description |
| --- | --- |
| `runSimulation()` | Monte Carlo simulation — generate random portfolio outcome scenarios using historical return distributions. |
| `estimateParams()` | Estimate mean and stdDev from historical returns. |

**Types:** `MonteCarloConfig`, `MonteCarloResult`

---

### Mtf Confluence

**File:** `src/domain/mtf-confluence.ts`

Multi-Timeframe Confluence — evaluates signals across daily, weekly, and monthly timeframes, producing a unified confluence score.

**Functions:**

| Function | Description |
| --- | --- |
| `computeMtfConfluence()` | Multi-Timeframe Confluence — evaluates signals across daily, weekly, and monthly timeframes, producing a unified confluence score. |

**Types:** `MtfSignal`, `MtfConfluenceResult`, `MtfConfluenceOptions`

---

### Name Enrichment

**File:** `src/domain/name-enrichment.ts`

Company name enrichment helpers (G19).

**Functions:**

| Function | Description |
| --- | --- |
| `normaliseCompanyName()` | Company name enrichment helpers (G19). |
| `extractShortName()` | Extract a compact short name from a raw provider name. |
| `formatDisplayName()` | Format a ticker and optional short name into a compact display string. |
| `enrichWatchlistEntry()` | Return an updated `WatchlistEntry` with a normalised `name` field. |
| `buildNameMap()` | Build a `Map<ticker, shortName>` from a list of `WatchlistEntry` objects for O(1) display-name lookup. |

---

### News Digest

**File:** `src/domain/news-digest.ts`

News digest domain helpers (I11).

**Functions:**

| Function | Description |
| --- | --- |
| `detectFormat()` | News digest domain helpers (I11). |
| `parseRssFeed()` | Parse RSS 2.0 XML into FeedItem[]. Uses regex for zero-dep parsing. |
| `parseAtomFeed()` | Parse Atom 1.0 XML into FeedItem[]. |
| `parseFeed()` | Auto-detect format and parse. |
| `extractTickers()` | Extract $TICKER cashtag mentions from text. Returns unique sorted list. |
| `groupByTicker()` | Group feed items by ticker mention. Items with no tickers are skipped. |
| `scoreSentiment()` | Score the sentiment of a text snippet. Returns a value in [-1, 1] where positive = bullish, negative = bearish. |
| `classifySentiment()` | Classify a sentiment score into a label. |
| `deduplicateItems()` | Remove duplicate items by id. Keeps the first occurrence. |
| `sortByDate()` | Sort items by pubDate descending (newest first). |
| `summariseDigest()` | Aggregate stats from a list of feed items. |

**Types:** `FeedItem`, `DigestSummary`

---

### Omega Ratio

**File:** `src/domain/omega-ratio.ts`

Omega Ratio — probability-weighted ratio of gains vs losses.

**Functions:**

| Function | Description |
| --- | --- |
| `computeOmega()` | Omega Ratio — probability-weighted ratio of gains vs losses. |
| `omegaFromReturns()` | Compute Omega ratio from raw return series (for portfolio analytics). |

**Types:** `OmegaResult`, `OmegaOptions`

---

### Optimal Turnover

**File:** `src/domain/optimal-turnover.ts`

Optimal portfolio turnover — transaction cost-aware rebalancing. Finds the closest rebalanced portfolio within a no-trade zone.

**Functions:**

| Function | Description |
| --- | --- |
| `optimalRebalance()` | Optimal portfolio turnover — transaction cost-aware rebalancing. Finds the closest rebalanced portfolio within a no-trade zone. |
| `computeTurnover()` | Calculate one-way turnover: Σ\|w_new - w_old\| / 2 |
| `breakEvenFrequency()` | Estimate break-even frequency: how often to rebalance given costs. Returns optimal rebalance period in units (e.g., days). |
| `cumulativeTurnover()` | Cumulative turnover over a history of weight snapshots. |

**Types:** `TurnoverResult`, `RebalanceConfig`

---

### Pairs Trading

**File:** `src/domain/pairs-trading.ts`

Pairs trading signals — z-score based entry/exit for cointegrated pairs. Generates trading signals from the spread between two cointegrated assets.

**Functions:**

| Function | Description |
| --- | --- |
| `hedgeRatio()` | Pairs trading signals — z-score based entry/exit for cointegrated pairs. Generates trading signals from the spread between two cointegrated assets. |
| `pairsSpread()` | Compute spread: Y - β·X. |
| `spreadZScore()` | Compute rolling z-score of spread. |
| `pairsSignals()` | Generate pairs trading signals from z-scores. |

**Types:** `PairsSignal`, `PairsTradeSignal`, `PairsConfig`

---

### Parabolic Sar Calculator

**File:** `src/domain/parabolic-sar-calculator.ts`

Parabolic SAR — Pure domain logic. Ported from Dart: lib/src/domain/parabolic_sar_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeSarSeries()` | — |
| `computeSar()` | — |

**Types:** `SarPoint`

---

### Peer Valuation

**File:** `src/domain/peer-valuation.ts`

Peer Valuation — compares a target company's valuation metrics against a set of peer companies, computing relative rankings, z-scores, and sector medians.

**Functions:**

| Function | Description |
| --- | --- |
| `computePeerValuation()` | Peer Valuation — compares a target company's valuation metrics against a set of peer companies, computing relative rankings, z-scores, and sector medians. |

**Types:** `CompanyMetrics`, `PeerMetricComparison`, `PeerValuationResult`

---

### Percentile Rank

**File:** `src/domain/percentile-rank.ts`

Percentile Rank utilities. percentile(values, p) — linear interpolation, p in [0, 100]. percentRank(values, target) — fraction of values <= target, in [0, 100]. rollingPercentRank(series, window) — for each i, percentRank of series[i] within the prior `window` values (inclusive of i).

**Functions:**

| Function | Description |
| --- | --- |
| `percentile()` | Percentile Rank utilities. percentile(values, p) — linear interpolation, p in [0, 100]. percentRank(values, target) — fraction of values <= target, in [0, 100]. rollingPercentRank(series, window) — for each i, percentRank of series[i] within the prior `window` values (inclusive of i). |
| `percentRank()` | — |
| `rollingPercentRank()` | — |

---

### Performance Attribution

**File:** `src/domain/performance-attribution.ts`

Brinson-Fachler Performance Attribution — decomposes portfolio excess return vs benchmark into allocation, selection, and interaction effects per sector/group.

**Functions:**

| Function | Description |
| --- | --- |
| `computeAttribution()` | Brinson-Fachler Performance Attribution — decomposes portfolio excess return vs benchmark into allocation, selection, and interaction effects per sector/group. |

**Types:** `SectorWeight`, `AttributionEffect`, `AttributionResult`

---

### Pivots

**File:** `src/domain/pivots.ts`

Floor pivot points: classic, Fibonacci, Camarilla, Woodie variants. Inputs are previous period's H/L/C; outputs are the central pivot plus three support and three resistance lines.

**Functions:**

| Function | Description |
| --- | --- |
| `computePivots()` | — |

**Types:** `PivotInput`, `PivotLevels`

---

### Profit Factor

**File:** `src/domain/profit-factor.ts`

Profit factor and trade performance metrics from a list of trades.

**Functions:**

| Function | Description |
| --- | --- |
| `profitFactor()` | Profit factor and trade performance metrics from a list of trades. |
| `equityCurve()` | Find max consecutive wins and losses. |

**Types:** `Trade`, `ProfitFactorResult`

---

### Range Bars

**File:** `src/domain/range-bars.ts`

Range bar chart computation.

**Functions:**

| Function | Description |
| --- | --- |
| `computeRangeBars()` | Range bar chart computation. |
| `suggestRangeSize()` | Suggest a range size based on average true range of the data. Uses median high-low spread. |

**Types:** `RangeBar`, `RangeBarInput`

---

### Regime Switching

**File:** `src/domain/regime-switching.ts`

Regime Switching (Hamilton filter) — bull/bear state detection. Implements a simplified 2-state Hidden Markov Model for market regimes.

**Functions:**

| Function | Description |
| --- | --- |
| `estimateRegimeParams()` | Regime Switching (Hamilton filter) — bull/bear state detection. Implements a simplified 2-state Hidden Markov Model for market regimes. |
| `hamiltonFilter()` | Hamilton filter — forward pass computing filtered probabilities. |
| `kimSmoother()` | Kim smoother — backward pass for smoothed probabilities. |
| `regimeSwitching()` | Full regime switching analysis. |

**Types:** `RegimeParams`, `RegimeResult`

---

### Relative Strength

**File:** `src/domain/relative-strength.ts`

Relative Strength Comparison domain helpers (H21).

**Functions:**

| Function | Description |
| --- | --- |
| `normalizeSeries()` | Relative Strength Comparison domain helpers (H21). |
| `windowStartDate()` | Compute a common window start date from a lookback string. |
| `computeRelativeStrengths()` | Compute relative strength comparison for multiple tickers. |
| `findOutperformer()` | Return the ticker with the highest total return (excludes benchmark). Returns `null` when no non-benchmark series have data. |
| `findUnderperformer()` | Return the ticker with the lowest total return (excludes benchmark). |
| `summariseReturns()` | Extract only the most recent `pct` per ticker as a flat summary map. Useful for sorting the legend by current return. |

**Types:** `RSPoint`, `RSeries`, `RSComparisonResult`, `RSInput`

---

### Renko

**File:** `src/domain/renko.ts`

Renko chart brick computation.

**Functions:**

| Function | Description |
| --- | --- |
| `computeRenko()` | Renko chart brick computation. |
| `suggestBrickSize()` | Suggest a brick size based on ATR-like heuristic. Uses median absolute daily change over the data window. |

**Types:** `RenkoBrick`, `RenkoInput`

---

### Resample

**File:** `src/domain/resample.ts`

Resample candles to a coarser timeframe by bucketing on a fixed interval. Inputs must be sorted ascending by `time` (ms epoch).

**Functions:**

| Function | Description |
| --- | --- |
| `resampleCandles()` | — |

**Types:** `ResampleOptions`

---

### Returns

**File:** `src/domain/returns.ts`

Returns calculations: simple, log, cumulative, and rolling. All functions assume non-empty inputs return [] and treat the first value as the baseline (no return for index 0).

**Functions:**

| Function | Description |
| --- | --- |
| `simpleReturns()` | Returns calculations: simple, log, cumulative, and rolling. All functions assume non-empty inputs return [] and treat the first value as the baseline (no return for index 0). |
| `cumulativeReturns()` | Cumulative return series starting at 0 (e.g. [0, 0.05, 0.07]). |
| `totalReturn()` | Total return between first and last price (compound). |
| `annualizedReturn()` | Annualized return given total return and number of years. |
| `logReturns()` | — |
| `rollingReturns()` | — |

---

### Rolling Sharpe

**File:** `src/domain/rolling-sharpe.ts`

Rolling Sharpe Ratio — compute Sharpe ratio over a sliding window.

**Functions:**

| Function | Description |
| --- | --- |
| `computeRollingSharpe()` | Rolling Sharpe Ratio — compute Sharpe ratio over a sliding window. |

**Types:** `RollingSharpePoint`, `RollingSharpeOptions`

---

### Rolling Stats

**File:** `src/domain/rolling-stats.ts`

Rolling statistics over a numeric series: mean, sample standard deviation, variance, min/max, z-score. Single-pass per metric using sliding-window updates where possible.

**Functions:**

| Function | Description |
| --- | --- |
| `rollingMean()` | Rolling statistics over a numeric series: mean, sample standard deviation, variance, min/max, z-score. Single-pass per metric using sliding-window updates where possible. |
| `rollingStdDev()` | Sample standard deviation (Bessel-corrected, n-1). |
| `rollingZScore()` | z = (x - mean(window)) / stdDev(window) for each terminal index. |
| `rollingMin()` | — |
| `rollingMax()` | — |

---

### Rsi Calculator

**File:** `src/domain/rsi-calculator.ts`

RSI Calculator — Pure domain logic. Ported from Dart: lib/src/domain/rsi_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeRsiSeries()` | RSI Calculator — Pure domain logic. Ported from Dart: lib/src/domain/rsi_calculator.dart |
| `computeRsi()` | Compute the current (latest) RSI value. Returns null if insufficient data. |

**Types:** `RsiPoint`

---

### Screener Fundamentals

**File:** `src/domain/screener-fundamentals.ts`

Screener fundamental filters — pure domain logic (Q3).

**Functions:**

| Function | Description |
| --- | --- |
| `matchesFundamentalFilters()` | Screener fundamental filters — pure domain logic (Q3). |
| `applyFundamentalFilters()` | Filter a parallel list of (ticker, data) pairs by fundamental criteria. Returns only the tickers whose data passes all constraints. |
| `explainFundamentalFilters()` | Explainability result for a single ticker's fundamental filter evaluation. */ export interface FundamentalFilterExplanation { readonly passed: boolean; /** Supplied constraints whose data was present and satisfied. */ readonly matchedFilters: readonly string[]; /** Supplied constraints whose data was present and violated — causes exclusion. */ readonly failedFilters: readonly string[]; /** Supplied constraints whose backing data field was absent (benefit of the doubt). */ readonly skippedFilters: readonly string[]; } |

**Types:** `FundamentalFilterParams`, `FundamentalFilterExplanation`

---

### Seasonality

**File:** `src/domain/seasonality.ts`

Seasonality aggregations: average daily return grouped by month (0–11) or day-of-week (0=Sun…6=Sat). Time inputs are ms since epoch.

**Functions:**

| Function | Description |
| --- | --- |
| `seasonalityByMonth()` | — |
| `seasonalityByDayOfWeek()` | — |

**Types:** `SeasonalityBucket`, `DailyReturn`

---

### Sector Allocation

**File:** `src/domain/sector-allocation.ts`

Sector allocation calculator — compute sector weightings and concentration metrics for a portfolio of holdings.

**Functions:**

| Function | Description |
| --- | --- |
| `calculateAllocations()` | Sector allocation calculator — compute sector weightings and concentration metrics for a portfolio of holdings. |
| `herfindahlIndex()` | Compute Herfindahl-Hirschman Index for concentration. Ranges 0–1: sum of squared weights. Higher = more concentrated. |
| `allocationSummary()` | Get full allocation summary for a portfolio. |
| `overweightSectors()` | Identify sectors that exceed a given weight threshold. |
| `underweightSectors()` | Identify sectors below a minimum weight threshold. |
| `deviationFromEqual()` | Calculate ideal equal-weight target and deviation from it. |

**Types:** `Holding`, `SectorAllocation`, `AllocationSummary`

---

### Sector Rotation

**File:** `src/domain/sector-rotation.ts`

Sector Rotation domain — relative strength ranking (H20).

**Functions:**

| Function | Description |
| --- | --- |
| `computeReturn()` | Sector Rotation domain — relative strength ranking (H20). |
| `computeRelativeReturn()` | Compute relative return of a sector vs. a benchmark. `rs = sectorReturn - benchmarkReturn` |
| `classifySectorPerformance()` | Classify sector performance relative to benchmark. |
| `rankSectors()` | Rank a list of sectors by their relative return vs. a benchmark (e.g. SPY). |

**Types:** `SectorReturnInput`, `SectorRankEntry`

---

### Signal Aggregator

**File:** `src/domain/signal-aggregator.ts`

Signal Aggregator — runs all 12 method detectors for a ticker, then feeds results into the consensus engine.

**Functions:**

| Function | Description |
| --- | --- |
| `aggregateSignals()` | Signal Aggregator — runs all 12 method detectors for a ticker, then feeds results into the consensus engine. |
| `aggregateConsensus()` | Run all 12 detectors and produce a consensus result. Pass optional per-method `weights` (G20) to personalise the score. |

---

### Signal Strategy Io

**File:** `src/domain/signal-strategy-io.ts`

Shared signal strategy I/O (I6).

**Functions:**

| Function | Description |
| --- | --- |
| `exportStrategy()` | Shared signal strategy I/O (I6). |
| `exportBundle()` | Bundle multiple strategies into a single export. |
| `importStrategy()` | Parse and validate a single strategy from JSON string. |
| `importBundle()` | Import a strategy bundle from JSON string. |
| `validateExpression()` | Basic expression syntax sanity check (no full parse, just red flags). |
| `validateVars()` | Ensure all variable values are number or boolean. |
| `checksumPayload()` | Compute a deterministic checksum for integrity verification. Uses DJB2 hash over the canonical fields (excluding checksum itself). |
| `encodeShareUrl()` | Encode a strategy payload into a shareable URL using base64url in the hash fragment (no server round-trip needed). |
| `decodeShareUrl()` | Decode a strategy payload from a share URL. |
| `payloadToClipboardText()` | Pretty-print a payload for clipboard sharing. |

**Types:** `StrategyPayload`, `StrategyBundle`, `ImportResult`

---

### Sma Calculator

**File:** `src/domain/sma-calculator.ts`

SMA Calculator — Pure domain logic. Ported from Dart: lib/src/domain/sma_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeSma()` | SMA Calculator — Pure domain logic. Ported from Dart: lib/src/domain/sma_calculator.dart |
| `computeSmaSeries()` | A single SMA data point aligned to a candle date. */ export interface SmaPoint { readonly date: string; readonly value: number \| null; } |

**Types:** `SmaPoint`

---

### Spectral Density

**File:** `src/domain/spectral-density.ts`

Spectral density estimation — periodogram and Welch's method. Identifies dominant cycles/frequencies in time series.

**Functions:**

| Function | Description |
| --- | --- |
| `periodogram()` | Spectral density estimation — periodogram and Welch's method. Identifies dominant cycles/frequencies in time series. |
| `welchSpectrum()` | Welch's method: averaged periodogram with overlapping windows. Reduces variance of spectral estimate. |
| `detectPeaks()` | Detect significant spectral peaks above noise floor. |

**Types:** `SpectralDensity`

---

### Standard Deviation

**File:** `src/domain/standard-deviation.ts`

Rolling standard deviation over a window of `period` samples. Defaults to population std-dev (divisor = period). Set `sample: true` for sample std-dev (divisor = period - 1). Uses an O(period) per-step formula (sum and sum-of-squares).

**Functions:**

| Function | Description |
| --- | --- |
| `computeStdDev()` | — |

**Types:** `StdDevOptions`

---

### Strategy Comparison

**File:** `src/domain/strategy-comparison.ts`

Strategy comparison — run two backtest configurations side-by-side on the same candle data and produce comparative metrics.

**Functions:**

| Function | Description |
| --- | --- |
| `compareStrategies()` | Strategy comparison — run two backtest configurations side-by-side on the same candle data and produce comparative metrics. |
| `renderComparisonTable()` | Render comparison HTML table summarizing both strategies. |

**Types:** `StrategyComparisonInput`, `StrategyComparisonResult`, `StrategyDelta`

---

### Streak Tracker

**File:** `src/domain/streak-tracker.ts`

Gain/loss streak tracker — analyze consecutive up/down days for streak detection and pattern awareness.

**Functions:**

| Function | Description |
| --- | --- |
| `currentStreak()` | Gain/loss streak tracker — analyze consecutive up/down days for streak detection and pattern awareness. |
| `longestGainStreak()` | Find the longest gain streak in a price series. |
| `longestLossStreak()` | Find the longest loss streak in a price series. |
| `analyzeStreak()` | Full streak analysis for a ticker. |
| `rankByStreak()` | Analyze streaks for multiple tickers, sorted by longest current streak. |
| `getGainStreaks()` | Get tickers on a gain streak of at least N days. |
| `getLossStreaks()` | Get tickers on a loss streak of at least N days. |

**Types:** `StreakResult`

---

### Support Resistance

**File:** `src/domain/support-resistance.ts`

Support/resistance level finder — identify key price levels from historical data using pivot points and price clustering.

**Functions:**

| Function | Description |
| --- | --- |
| `findSwingLows()` | Support/resistance level finder — identify key price levels from historical data using pivot points and price clustering. |
| `findSwingHighs()` | Find local maxima (swing highs) in a price series. |
| `clusterLevels()` | Cluster nearby price levels into zones. Levels within `tolerance` percent are merged. |
| `findLevels()` | Find support and resistance levels from a price series. |
| `nearestSupport()` | Get nearest support level below current price. |
| `nearestResistance()` | Get nearest resistance level above current price. |

**Types:** `PriceLevel`

---

### Tail Index

**File:** `src/domain/tail-index.ts`

Tail index estimation (Extreme Value Theory) — Hill estimator, peaks-over-threshold. Quantifies tail heaviness for risk management.

**Functions:**

| Function | Description |
| --- | --- |
| `hillEstimator()` | Tail index estimation (Extreme Value Theory) — Hill estimator, peaks-over-threshold. Quantifies tail heaviness for risk management. |
| `peaksOverThreshold()` | Peaks-over-threshold method with Generalized Pareto Distribution (GPD) fit. |
| `meanExcessFunction()` | Mean excess function: E[X - u \| X > u] for various thresholds. Linear mean excess plot indicates GPD tail. |
| `gpdRiskMeasures()` | VaR and ES estimation using GPD tail model. |

**Types:** `TailIndexResult`, `PeaksOverThreshold`

---

### Ticker Catalog

**File:** `src/domain/ticker-catalog.ts`

Static ticker catalog — offline fuzzy lookup for the ticker search box.

**Functions:**

| Function | Description |
| --- | --- |
| `getTickerCatalog()` | Static ticker catalog — offline fuzzy lookup for the ticker search box. |
| `isSupportedSymbol()` | Symbol formats CrossTide accepts, matching the Worker's ticker guard: plain equities (`MSFT`), share classes (`BRK.B`), crypto pairs (`BTC-USD`), indices (`^GSPC`) and forex pairs (`EURUSD=X`). |
| `searchTickerCatalog()` | Score a catalog entry against a normalized (upper-case, trimmed) query. Returns 0 when the entry does not match at all. |

**Types:** `TickerCatalogEntry`

---

### Ticker Comparison

**File:** `src/domain/ticker-comparison.ts`

Ticker comparison table — side-by-side data comparison for multiple tickers across various metrics.

**Functions:**

| Function | Description |
| --- | --- |
| `buildComparison()` | Ticker comparison table — side-by-side data comparison for multiple tickers across various metrics. |
| `rankByMetric()` | Rank tickers by a specific metric (descending). |
| `distanceFrom52WeekHigh()` | Calculate the percent distance from 52-week high. |
| `distanceFrom52WeekLow()` | Calculate the percent distance from 52-week low. |
| `performanceRank()` | Get the relative performance rank (1 = best) for each ticker. |

**Types:** `TickerMetrics`, `ComparisonColumn`, `ComparisonResult`

---

### Trade Journal

**File:** `src/domain/trade-journal.ts`

Trade Journal Analytics — pure functions to analyze a user's trade log and compute performance statistics.

**Functions:**

| Function | Description |
| --- | --- |
| `analyzeTradeJournal()` | Trade Journal Analytics — pure functions to analyze a user's trade log and compute performance statistics. |

**Types:** `TradeEntry`, `TradeStats`, `TradeResult`

---

### Trade Stats

**File:** `src/domain/trade-stats.ts`

Trade performance stats — calculate key trading metrics from a history of completed trades.

**Functions:**

| Function | Description |
| --- | --- |
| `tradePnl()` | Trade performance stats — calculate key trading metrics from a history of completed trades. |
| `computeStats()` | Calculate comprehensive trade statistics. |
| `streaks()` | Calculate consecutive wins/losses streaks. |
| `avgReturnPercent()` | Calculate average holding return percent. |

**Types:** `Trade`, `TradeStats`

---

### Trix

**File:** `src/domain/trix.ts`

TRIX (Jack Hutson, 1980s): rate of change of a triple-smoothed EMA. ema1 = EMA(close, period) ema2 = EMA(ema1,  period) ema3 = EMA(ema2,  period) trix = 100 * (ema3[t] - ema3[t-1]) / ema3[t-1] A signal line is an EMA of TRIX.

**Functions:**

| Function | Description |
| --- | --- |
| `computeTrix()` | — |

**Types:** `TrixPoint`

---

### Ulcer Index

**File:** `src/domain/ulcer-index.ts`

Ulcer Index (Peter Martin, 1987). Measures depth and duration of drawdowns over a window: pctDD[i] = 100 * (close[i] - max(close, period)) / max(close, period) UI       = sqrt( mean(pctDD^2, period) ) Higher = more painful drawdowns.

**Functions:**

| Function | Description |
| --- | --- |
| `computeUlcerIndex()` | Ulcer Index (Peter Martin, 1987). Measures depth and duration of drawdowns over a window: pctDD[i] = 100 * (close[i] - max(close, period)) / max(close, period) UI       = sqrt( mean(pctDD^2, period) ) Higher = more painful drawdowns. |

---

### Validate Ohlcv

**File:** `src/domain/validate-ohlcv.ts`

Validate OHLCV quality before prices reach calculations or views.

**Functions:**

| Function | Description |
| --- | --- |
| `validateOhlcv()` | — |

**Types:** `OhlcvQualityIssue`, `OhlcvQualityOptions`, `OhlcvQualityReport`

---

### Vortex Indicator

**File:** `src/domain/vortex-indicator.ts`

Vortex Indicator (Etienne Botes & Douglas Siepman, 2009). VM+[i] = |high[i]   - low[i-1]| VM-[i] = |low[i]    - high[i-1]| TR[i]  = max(high-low, |high-prevClose|, |low-prevClose|) VI+    = sum(VM+, period) / sum(TR, period) VI-    = sum(VM-, period) / sum(TR, period) VI+ crossing above VI- is a bullish signal.

**Functions:**

| Function | Description |
| --- | --- |
| `computeVortex()` | — |

**Types:** `VortexPoint`

---

### Walk Forward

**File:** `src/domain/walk-forward.ts`

Walk-forward analysis — out-of-sample backtest validation. Splits data into in-sample (train) and out-of-sample (test) windows, rolls forward, and aggregates out-of-sample performance.

**Functions:**

| Function | Description |
| --- | --- |
| `walkForward()` | Walk-forward analysis — out-of-sample backtest validation. Splits data into in-sample (train) and out-of-sample (test) windows, rolls forward, and aggregates out-of-sample performance. |
| `anchoredWalkForward()` | Anchored walk-forward: in-sample grows (always starts at 0), out-of-sample is fixed window rolling forward. |

**Types:** `WalkForwardWindow`, `WalkForwardResult`

---

### Watchlist Share

**File:** `src/domain/watchlist-share.ts`

Collaborative watchlist sharing via URL snapshots (I8).

**Functions:**

| Function | Description |
| --- | --- |
| `createWatchlistSnapshot()` | Collaborative watchlist sharing via URL snapshots (I8). |
| `encodeWatchlistUrl()` | Encode a watchlist snapshot into a shareable URL. |
| `decodeWatchlistUrl()` | Decode a watchlist snapshot from a URL. |
| `decodeWatchlistPayload()` | Decode a raw base64url watchlist payload string. |
| `mergeWatchlists()` | Merge imported tickers into an existing watchlist, preserving order. |
| `snapshotToText()` | Compute a compact text summary of a snapshot for clipboard/display. |

**Types:** `WatchlistSnapshot`, `WatchlistImportResult`, `MergeResult`

---

### Wavelet

**File:** `src/domain/wavelet.ts`

Wavelet decomposition — multi-resolution analysis for price series. Uses Haar wavelet (simplest orthogonal wavelet) for signal decomposition.

**Functions:**

| Function | Description |
| --- | --- |
| `haarForward()` | Wavelet decomposition — multi-resolution analysis for price series. Uses Haar wavelet (simplest orthogonal wavelet) for signal decomposition. |
| `haarInverse()` | Haar wavelet inverse transform — one level. |
| `waveletDecompose()` | Multi-level Haar wavelet decomposition. Decomposes signal into `maxLevel` resolution levels. |
| `waveletDenoise()` | Reconstruct signal from wavelet levels. |
| `waveletEnergy()` | Extract energy at each wavelet scale — useful for identifying dominant cycles. |

**Types:** `WaveletLevel`, `WaveletDecomposition`

---

### Williams R Calculator

**File:** `src/domain/williams-r-calculator.ts`

Williams %R — Pure domain logic. Ported from Dart: lib/src/domain/williams_percent_r_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeWilliamsRSeries()` | — |
| `computeWilliamsR()` | — |

**Types:** `WilliamsRPoint`

---

### Zigzag

**File:** `src/domain/zigzag.ts`

ZigZag pivot detector. Marks alternating swing highs and swing lows separated by at least `thresholdPercent` reversal from the last confirmed pivot. Used to filter out noise and identify Elliott / fib legs on a chart.

**Functions:**

| Function | Description |
| --- | --- |
| `computeZigZag()` | — |

**Types:** `ZigZagPivot`, `ZigZagOptions`

---

## 🔺 Pattern Recognition

### Breakout Detector

**File:** `src/domain/breakout-detector.ts`

Breakout detector — identify price breakouts above resistance or below support with optional volume confirmation.

**Functions:**

| Function | Description |
| --- | --- |
| `rollingHigh()` | Breakout detector — identify price breakouts above resistance or below support with optional volume confirmation. |
| `rollingLow()` | Find the lowest close in a lookback window (support proxy). |
| `detectBreakouts()` | Compute average volume over a lookback window. |
| `confirmedBreakouts()` | Filter only confirmed breakouts (volume above threshold). |
| `lastBreakout()` | Get the most recent breakout event. |

**Types:** `BreakoutCandle`, `BreakoutEvent`

---

### Candlestick Patterns

**File:** `src/domain/candlestick-patterns.ts`

Candlestick pattern detector — identify common bullish/bearish single and multi-bar patterns from OHLC data.

**Functions:**

| Function | Description |
| --- | --- |
| `isDoji()` | Candlestick pattern detector — identify common bullish/bearish single and multi-bar patterns from OHLC data. |
| `isHammer()` | Detect a Hammer (small body at top, long lower shadow). |
| `isShootingStar()` | Detect a Shooting Star (small body at bottom, long upper shadow). |
| `isEngulfing()` | Detect an Engulfing pattern (2-bar). |
| `isMarubozu()` | Detect a Marubozu (full body, minimal shadows). |
| `scanPatterns()` | Scan a candle series for all recognized patterns. |
| `filterByType()` | Filter patterns by type. |
| `lastPattern()` | Get the most recent pattern. |

**Types:** `Candle`, `PatternMatch`

---

### Pattern Recognition

**File:** `src/domain/pattern-recognition.ts`

Candlestick pattern recognition — rule-based detection (I2).

**Functions:**

| Function | Description |
| --- | --- |
| `bodySize()` | Candlestick pattern recognition — rule-based detection (I2). |
| `candleRange()` | Full candle range (high - low). |
| `upperShadow()` | Upper shadow length. |
| `lowerShadow()` | Lower shadow length. |
| `isBullish()` | True when close >= open (green candle). |
| `isDoji()` | Detect Doji: body is ≤5% of total range. |
| `isHammer()` | Detect Hammer: small body at the top, long lower shadow (≥2× body). Bullish reversal signal when found at a swing low. |
| `isShootingStar()` | Detect Shooting Star: small body at the bottom, long upper shadow. Bearish reversal signal when found at a swing high. |
| `isSpinningTop()` | Detect Spinning Top: small body with notable shadows on both sides. |
| `isMarubozu()` | Detect Marubozu: body fills ≥95% of the range (very little shadow). |
| `isBullishEngulfing()` | Detect Bullish Engulfing: second candle's body fully engulfs first. First candle is bearish, second is bullish. |
| `isBearishEngulfing()` | Detect Bearish Engulfing: second candle's body fully engulfs first. First candle is bullish, second is bearish. |
| `isMorningStar()` | Detect Morning Star: three-candle bullish reversal. 1st bearish, 2nd small body (star), 3rd bullish closing above midpoint of 1st. |
| `isEveningStar()` | Detect Evening Star: three-candle bearish reversal. 1st bullish, 2nd small body (star), 3rd bearish closing below midpoint of 1st. |
| `isThreeWhiteSoldiers()` | Detect Three White Soldiers: three consecutive bullish candles, each closing higher with minimal upper shadow. |
| `isThreeBlackCrows()` | Detect Three Black Crows: three consecutive bearish candles, each closing lower with minimal lower shadow. |
| `detectAllPatterns()` | Scan an array of candles and return all detected patterns. Results are sorted by index ascending, then by confidence descending. |

**Types:** `PatternCandle`, `DetectedPattern`

---

## 💼 Portfolio & Risk

### Portfolio Analytics

**File:** `src/domain/portfolio-analytics.ts`

Portfolio aggregations: holdings → sector allocation, position weights, top-N concentration, and unrealized P/L roll-up.

**Functions:**

| Function | Description |
| --- | --- |
| `topConcentration()` | Portfolio aggregations: holdings → sector allocation, position weights, top-N concentration, and unrealized P/L roll-up. |
| `positionValue()` | — |
| `unrealizedPnl()` | — |
| `totalValue()` | — |
| `sectorAllocation()` | — |
| `positionMetrics()` | — |

**Types:** `Holding`, `SectorAllocation`, `PositionMetric`

---

### Portfolio Benchmark

**File:** `src/domain/portfolio-benchmark.ts`

Portfolio benchmark comparison — compare portfolio returns against a market index.

**Functions:**

| Function | Description |
| --- | --- |
| `computeBenchmarkComparison()` | Portfolio benchmark comparison — compare portfolio returns against a market index. |
| `buildReturnSeries()` | Generate a normalized return series for comparison charting. Both series start at baseValue (e.g. 10000) and diverge based on daily returns. |

**Types:** `BenchmarkComparison`, `ReturnSeries`

---

### Portfolio Rebalance

**File:** `src/domain/portfolio-rebalance.ts`

Portfolio rebalance calculator — compute trades needed to bring a portfolio back to target allocation weights.

**Functions:**

| Function | Description |
| --- | --- |
| `calculateRebalance()` | Portfolio rebalance calculator — compute trades needed to bring a portfolio back to target allocation weights. |
| `actionableTrades()` | Get only trades that require action (excludes holds). |
| `totalBuyAmount()` | Get total buy amount needed. |
| `totalSellAmount()` | Get total sell amount needed. |
| `sharesToTrade()` | Calculate the number of shares to trade given a price. |
| `validateTargets()` | Validate that target allocations sum to approximately 1. |

**Types:** `CurrentHolding`, `TargetAllocation`, `RebalanceTrade`, `RebalancePlan`, `RebalanceExplanation`

---

### Position Risk

**File:** `src/domain/position-risk.ts`

Position-level risk metrics — stop distance, risk percentage, portfolio heat, and risk-reward assessment per position.

**Functions:**

| Function | Description |
| --- | --- |
| `computePositionRisk()` | Position-level risk metrics — stop distance, risk percentage, portfolio heat, and risk-reward assessment per position. |
| `computePortfolioHeat()` | Calculate aggregate portfolio heat from multiple positions. |

**Types:** `PositionInput`, `PositionRisk`, `PositionRiskExplanation`, `PortfolioHeat`, `PortfolioHeatExplanation`

---

### Risk Adjusted Comparison

**File:** `src/domain/risk-adjusted-comparison.ts`

Risk-Adjusted Return Comparison — compare multiple assets on Sharpe, Sortino, Calmar, and max drawdown metrics side-by-side.

**Functions:**

| Function | Description |
| --- | --- |
| `compareRiskAdjusted()` | Risk-Adjusted Return Comparison — compare multiple assets on Sharpe, Sortino, Calmar, and max drawdown metrics side-by-side. |

**Types:** `AssetRiskMetrics`, `RiskComparisonResult`

---

### Risk Contribution

**File:** `src/domain/risk-contribution.ts`

Risk contribution (Euler decomposition) — marginal and component risk. Decomposes portfolio VaR/volatility into per-asset contributions.

**Functions:**

| Function | Description |
| --- | --- |
| `eulerDecomposition()` | Risk contribution (Euler decomposition) — marginal and component risk. Decomposes portfolio VaR/volatility into per-asset contributions. |
| `riskParityWeights()` | Risk parity weights — find weights where all assets have equal risk contribution. Uses iterative gradient descent. |
| `incrementalVaR()` | Incremental VaR: how much does adding asset i increase portfolio VaR? |

**Types:** `RiskDecomposition`

---

### Risk Parity

**File:** `src/domain/risk-parity.ts`

Risk parity allocator — compute portfolio weights where each asset contributes equally to total portfolio risk.

**Functions:**

| Function | Description |
| --- | --- |
| `inverseVolWeights()` | Risk parity allocator — compute portfolio weights where each asset contributes equally to total portfolio risk. |
| `riskContributions()` | Compute risk contribution of each asset. Risk contribution = weight * volatility (simplified, assumes no correlation). |
| `riskParityAllocate()` | Full risk parity allocation. |
| `equalWeight()` | Equal-weight allocation for comparison. |
| `compareAllocations()` | Compare risk parity vs equal weight allocations. |

**Types:** `RiskParityInput`, `RiskParityResult`

---

### Risk Ratios

**File:** `src/domain/risk-ratios.ts`

Risk-adjusted return metrics that complement Sharpe in `backtest-engine.ts`. All inputs are *period* returns (e.g. daily) and a `periodsPerYear` factor controls annualization.

**Functions:**

| Function | Description |
| --- | --- |
| `sortinoRatio()` | Risk-adjusted return metrics that complement Sharpe in `backtest-engine.ts`. All inputs are *period* returns (e.g. daily) and a `periodsPerYear` factor controls annualization. |
| `maxDrawdown()` | Compute the maximum drawdown from an equity curve as a positive fraction (e.g. 0.25 for a 25% drawdown). |
| `cagr()` | CAGR from an equity curve, given the number of years spanned. Returns 0 when years <= 0 or equity[0] <= 0. |
| `calmarRatio()` | Calmar ratio: CAGR / max drawdown. Returns Infinity when there is no drawdown but a positive CAGR; returns 0 when CAGR is 0. |

**Types:** `RatioOptions`

---

### Risk Reward

**File:** `src/domain/risk-reward.ts`

Risk/reward ratio calculator — evaluate trade setups with entry, stop loss, and target price.

**Functions:**

| Function | Description |
| --- | --- |
| `analyzeRiskReward()` | Risk/reward ratio calculator — evaluate trade setups with entry, stop loss, and target price. |
| `positionSizeFromRisk()` | Calculate position size based on max risk amount. |
| `dollarRisk()` | Calculate the dollar risk for a given position. |
| `expectedValue()` | Expected value of a trade given win probability and R:R ratio. Returns expected $ per $1 risked. |
| `batchAnalyze()` | Batch analyze multiple trade setups. |
| `filterFavorable()` | Filter only favorable setups (R:R >= minRatio). |
| `sortByRatio()` | Sort setups by risk/reward ratio (best first). |

**Types:** `TradeSetup`, `RiskRewardAnalysis`

---

### Tail Risk

**File:** `src/domain/tail-risk.ts`

Tail risk metrics — CVaR (Conditional Value at Risk) / Expected Shortfall. Measures the expected loss in the worst X% of scenarios.

**Functions:**

| Function | Description |
| --- | --- |
| `historicalVaR()` | Tail risk metrics — CVaR (Conditional Value at Risk) / Expected Shortfall. Measures the expected loss in the worst X% of scenarios. |
| `cvar()` | Conditional Value at Risk (Expected Shortfall). Average loss in the worst (1-confidence)% of cases. CVaR is always >= VaR. |
| `parametricVaR()` | Parametric VaR assuming normal distribution. VaR = -μ + σ * z_α |
| `cornishFisherVaR()` | Cornish-Fisher VaR (adjusts for skewness and kurtosis). |
| `tailRiskAnalysis()` | Tail risk summary for a return series. |

---

## 🧬 Signal DSL

### Signal Dsl

**File:** `src/domain/signal-dsl.ts`

Tiny safe expression evaluator for user-authored signal rules.

**Functions:**

| Function | Description |
| --- | --- |
| `tokenize()` | — |
| `parse()` | — |
| `evaluate()` | — |
| `compileSignal()` | — |

**Types:** `EvalContext`

---

## 📶 Signal Methods

### Adx Method

**File:** `src/domain/adx-method.ts`

ADX Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/adx_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Bollinger Method

**File:** `src/domain/bollinger-method.ts`

Bollinger Bands Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/bollinger_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Cci Method

**File:** `src/domain/cci-method.ts`

CCI Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/cci_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Consensus Engine

**File:** `src/domain/consensus-engine.ts`

Consensus Engine — Pure domain logic. Ported from Dart: lib/src/domain/consensus_engine.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluateConsensus()` | Consensus Engine — Pure domain logic. Ported from Dart: lib/src/domain/consensus_engine.dart |

---

### Macd Method

**File:** `src/domain/macd-method.ts`

MACD Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/macd_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Mfi Method

**File:** `src/domain/mfi-method.ts`

MFI Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/mfi_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Micho Method

**File:** `src/domain/micho-method.ts`

Micho Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/micho_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Obv Method

**File:** `src/domain/obv-method.ts`

OBV Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/obv_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Rsi Method

**File:** `src/domain/rsi-method.ts`

RSI Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/rsi_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Sar Method

**File:** `src/domain/sar-method.ts`

Parabolic SAR Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/sar_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Stochastic Method

**File:** `src/domain/stochastic-method.ts`

Stochastic Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/stochastic_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Supertrend Method

**File:** `src/domain/supertrend-method.ts`

SuperTrend Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/supertrend_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

### Williams R Method

**File:** `src/domain/williams-r-method.ts`

Williams %R Method Detector — Pure domain logic. Ported from Dart: lib/src/domain/williams_r_method_detector.dart

**Functions:**

| Function | Description |
| --- | --- |
| `evaluate()` | — |

---

## 📐 Statistical Analysis

### Autocorrelation

**File:** `src/domain/autocorrelation.ts`

Autocorrelation — serial correlation analysis for price returns. Detects momentum, mean reversion, and market efficiency.

**Functions:**

| Function | Description |
| --- | --- |
| `autocorrelation()` | Autocorrelation — serial correlation analysis for price returns. Detects momentum, mean reversion, and market efficiency. |
| `acf()` | Compute autocorrelation function for lags 1..maxLag. |
| `partialAutocorrelation()` | Partial autocorrelation at a specific lag using Durbin-Levinson recursion. |
| `pacf()` | Compute partial autocorrelation function for lags 1..maxLag. |
| `ljungBox()` | Ljung-Box Q-statistic for testing serial independence. H0: no autocorrelation up to lag K. Higher Q → reject H0 → series has serial correlation. |
| `autocorrelationAnalysis()` | Summarize autocorrelation analysis. |

---

### Cointegration

**File:** `src/domain/cointegration.ts`

Cointegration test — Engle-Granger two-step method for pairs trading. Tests whether two price series share a long-run equilibrium.

**Functions:**

| Function | Description |
| --- | --- |
| `ols()` | Cointegration test — Engle-Granger two-step method for pairs trading. Tests whether two price series share a long-run equilibrium. |
| `adfStatistic()` | Augmented Dickey-Fuller test statistic on a series. Tests H0: unit root (non-stationary) vs H1: stationary. More negative = stronger rejection of unit root. |
| `engleGranger()` | Critical values for ADF test (approximate, no intercept). At n=100: 1%=-3.51, 5%=-2.89, 10%=-2.58 |
| `halfLife()` | Estimate mean-reversion half-life of a spread using OLS on ΔS = λ * S_{t-1}. Half-life = -ln(2) / λ |
| `spreadZScore()` | Compute z-score of current spread value. |

---

### Copula

**File:** `src/domain/copula.ts`

Copula dependence — models joint tail dependence between assets. Supports Clayton (lower tail) and Gumbel (upper tail) copulas.

**Functions:**

| Function | Description |
| --- | --- |
| `fitClayton()` | Copula dependence — models joint tail dependence between assets. Supports Clayton (lower tail) and Gumbel (upper tail) copulas. |
| `fitGumbel()` | Fit Gumbel copula parameter via Kendall's tau inversion. Gumbel copula has upper tail dependence: λ_U = 2 - 2^(1/θ). |
| `fitGaussian()` | Fit Gaussian copula (no tail dependence). |
| `dependenceAnalysis()` | Full dependence analysis: fit all copulas, select best by log-likelihood. |
| `toUniform()` | Convert raw returns to pseudo-uniform marginals via rank transform. |
| `kendallTau()` | Kendall's rank correlation (tau-b). |

**Types:** `CopulaFit`, `DependenceAnalysis`

---

### Correlation Check

**File:** `src/domain/correlation-check.ts`

Ticker correlation quick-check — compute Pearson correlation coefficient between two price series without needing the full correlation matrix card.

**Functions:**

| Function | Description |
| --- | --- |
| `pearsonCorrelation()` | Ticker correlation quick-check — compute Pearson correlation coefficient between two price series without needing the full correlation matrix card. |
| `computeReturns()` | Compute percentage returns from a price series. |
| `interpretCorrelation()` | Interpret correlation strength. |
| `correlationCheck()` | Full correlation check between two price series. Computes correlation on returns (not raw prices) for stationarity. |

**Types:** `CorrelationResult`

---

### Correlation Heatmap

**File:** `src/domain/correlation-heatmap.ts`

Correlation Heatmap render-data helpers (G22).

**Functions:**

| Function | Description |
| --- | --- |
| `rToHslColor()` | Correlation Heatmap render-data helpers (G22). |
| `buildHeatmapRenderData()` | Build the full flat array of `HeatmapCell` objects from a `CorrelationResult`. |
| `sliceCorrelationResult()` | Extract a 2-D sliced view of the heatmap for a subset of ticker IDs. Returns a new `CorrelationResult`-shaped object for only the requested IDs (in the order provided). |

**Types:** `HeatmapCell`, `HeatmapRenderData`

---

### Correlation Matrix

**File:** `src/domain/correlation-matrix.ts`

Pearson correlation between aligned numeric series. Produces a symmetric N×N matrix with 1.0 on the diagonal. Inputs that are not the same length are truncated to the shortest.

**Functions:**

| Function | Description |
| --- | --- |
| `pearson()` | — |
| `correlationMatrix()` | — |

**Types:** `CorrelationInput`, `CorrelationResult`

---

### Correlation Scanner

**File:** `src/domain/correlation-scanner.ts`

Correlation scanner — scan multiple assets to find highest/lowest correlated pairs over a given lookback window.

**Functions:**

| Function | Description |
| --- | --- |
| `scanCorrelations()` | Correlation scanner — scan multiple assets to find highest/lowest correlated pairs over a given lookback window. |

**Types:** `CorrelationScanConfig`, `ScannedCorrelation`, `CorrelationScanResult`

---

### Pair Correlation

**File:** `src/domain/pair-correlation.ts`

Pair correlation calculator — compute Pearson correlation between ticker return series for diversification analysis.

**Functions:**

| Function | Description |
| --- | --- |
| `dailyReturns()` | Pair correlation calculator — compute Pearson correlation between ticker return series for diversification analysis. |
| `pearsonCorrelation()` | Pearson correlation coefficient between two series of equal length. |
| `tickerCorrelation()` | Compute correlation between two tickers' price series. |
| `buildCorrelationMatrix()` | Build a full NxN correlation matrix from price data. |
| `mostCorrelatedPairs()` | Find the most correlated pairs (highest absolute correlation). |
| `leastCorrelatedPairs()` | Find least correlated pairs (best for diversification). |

**Types:** `CorrelationPair`, `CorrelationMatrix`

---

### Rolling Correlation

**File:** `src/domain/rolling-correlation.ts`

Rolling Correlation — sliding-window Pearson correlation between two price series.

**Functions:**

| Function | Description |
| --- | --- |
| `computeRollingCorrelation()` | Rolling Correlation — sliding-window Pearson correlation between two price series. |

**Types:** `RollingCorrelationPoint`, `RollingCorrelationOptions`

---

## 📈 Trend Indicators

### Adaptive Rsi

**File:** `src/domain/adaptive-rsi.ts`

Adaptive RSI — RSI with a dynamically adjusted lookback period based on price efficiency (Kaufman-style). When the market is trending, the effective period shortens (more responsive); in choppy markets it lengthens (more smoothing).

**Functions:**

| Function | Description |
| --- | --- |
| `computeAdaptiveRsi()` | Adaptive RSI — RSI with a dynamically adjusted lookback period based on price efficiency (Kaufman-style). When the market is trending, the effective period shortens (more responsive); in choppy markets it lengthens (more smoothing). |

**Types:** `AdaptiveRsiPoint`, `AdaptiveRsiOptions`

---

### Choppiness Index

**File:** `src/domain/choppiness-index.ts`

Choppiness Index. E.W. Dreiss's measure of whether the market is trending (low values) or choppy/ranging (high values). Scaled 0–100; values > ~61.8 typically indicate consolidation, < ~38.2 indicate trend.

**Functions:**

| Function | Description |
| --- | --- |
| `computeChoppinessIndex()` | — |

---

### Envelope

**File:** `src/domain/envelope.ts`

Moving Average Envelope. Symmetric upper/lower bands at a fixed percentage above/below an SMA. middle = SMA(close, period) upper  = middle * (1 + percent/100) lower  = middle * (1 - percent/100)

**Functions:**

| Function | Description |
| --- | --- |
| `computeEnvelope()` | — |

**Types:** `EnvelopePoint`

---

### Fractal Dimension

**File:** `src/domain/fractal-dimension.ts`

Fractal dimension — measures market complexity and roughness. Higher fractal dimension = more random/choppy; lower = more trending.

**Functions:**

| Function | Description |
| --- | --- |
| `higuchiFractalDimension()` | Fractal dimension — measures market complexity and roughness. Higher fractal dimension = more random/choppy; lower = more trending. |
| `boxCountingDimension()` | Box-counting fractal dimension (simplified for 1D series). Counts how many boxes of size ε are needed to cover the series. |
| `katzFractalDimension()` | Katz fractal dimension — simple estimator using path length. FD = log(L/d) / log(L/d + log(n)) where L = total path length, d = max displacement, n = number of points |
| `interpretFractalDimension()` | Interpret fractal dimension value. |

---

### Hull Ma

**File:** `src/domain/hull-ma.ts`

Hull Moving Average — Alan Hull (2005). Smooth + responsive: HMA(n) = WMA( 2*WMA(n/2) - WMA(n), sqrt(n) )

**Functions:**

| Function | Description |
| --- | --- |
| `computeHullMA()` | — |

---

### Hurst Exponent

**File:** `src/domain/hurst-exponent.ts`

Hurst exponent — measure whether a time series is trending, mean-reverting, or random walk using Rescaled Range (R/S) analysis.

**Functions:**

| Function | Description |
| --- | --- |
| `hurstExponent()` | Hurst exponent — measure whether a time series is trending, mean-reverting, or random walk using Rescaled Range (R/S) analysis. |
| `isTrending()` | Simple linear regression slope. |
| `isMeanReverting()` | Quick classification of mean-reverting behavior. |

**Types:** `HurstResult`

---

### Kalman Filter

**File:** `src/domain/kalman-filter.ts`

Kalman filter — adaptive price smoothing and trend estimation. Provides optimal linear filtering with dynamic noise adaptation.

**Functions:**

| Function | Description |
| --- | --- |
| `initKalman()` | Kalman filter — adaptive price smoothing and trend estimation. Provides optimal linear filtering with dynamic noise adaptation. |
| `kalmanStep()` | Single Kalman filter predict + update step. |
| `kalmanFilter()` | Run Kalman filter over entire price series. Returns smoothed prices and velocity (trend) estimates. |
| `adaptiveKalmanFilter()` | Adaptive Kalman filter — adjusts measurement noise based on recent innovation. |
| `kalmanTrendSignal()` | Generate Kalman trend signal: +1 (uptrend), -1 (downtrend), 0 (flat). |

**Types:** `KalmanState`, `KalmanParams`

---

### Kama

**File:** `src/domain/kama.ts`

Perry Kaufman's Adaptive Moving Average (KAMA). Reacts faster when trend is strong (low noise) and smooths heavily when noisy.

**Functions:**

| Function | Description |
| --- | --- |
| `computeKama()` | — |

**Types:** `KamaOptions`

---

### Ma Ribbon

**File:** `src/domain/ma-ribbon.ts`

Moving average ribbon — compute multiple MAs (5,10,20,50,100,200) with spread/convergence metrics for trend analysis.

**Functions:**

| Function | Description |
| --- | --- |
| `computeRibbon()` | Moving average ribbon — compute multiple MAs (5,10,20,50,100,200) with spread/convergence metrics for trend analysis. |
| `ribbonSummary()` | Get ribbon summary for the latest point. |
| `findCrossovers()` | Detect ribbon crossover events (golden/death cross style). |

**Types:** `RibbonPoint`, `RibbonSummary`

---

### Mass Index

**File:** `src/domain/mass-index.ts`

Mass Index (Donald Dorsey, 1990s). Identifies trend reversals from range expansion, *not* direction. ema1   = EMA(high - low, emaPeriod)        // default 9 ema2   = EMA(ema1, emaPeriod)              // default 9 ratio  = ema1 / ema2 MI     = sum(ratio, sumPeriod)             // default 25 A "reversal bulge" occurs when MI rises above ~27 then drops below 26.5.

**Functions:**

| Function | Description |
| --- | --- |
| `computeMassIndex()` | — |

---

### Mean Reversion

**File:** `src/domain/mean-reversion.ts`

Mean reversion scanner — identify assets that are far from their moving average (z-score based) for potential reversion trades.

**Functions:**

| Function | Description |
| --- | --- |
| `zScore()` | Mean reversion scanner — identify assets that are far from their moving average (z-score based) for potential reversion trades. |
| `deviationFromMa()` | Compute deviation from moving average in percent. |
| `analyzeReversion()` | Analyze a single asset for mean reversion potential. |
| `scanForReversion()` | Scan multiple assets and find mean-reversion candidates. |
| `mostOversold()` | Get the most oversold assets (potential long entries). |
| `mostOverbought()` | Get the most overbought assets (potential short entries). |

**Types:** `MeanReversionSignal`

---

### Multi Timeframe

**File:** `src/domain/multi-timeframe.ts`

Multi-timeframe trend — consolidate trend signals across daily, weekly, and monthly timeframes for confluence.

**Functions:**

| Function | Description |
| --- | --- |
| `detectTrend()` | Multi-timeframe trend — consolidate trend signals across daily, weekly, and monthly timeframes for confluence. |
| `resampleWeekly()` | Resample daily prices to weekly closes (every 5th bar). |
| `resampleMonthly()` | Resample daily prices to monthly closes (every 21st bar). |
| `multiTimeframeTrend()` | Compute multi-timeframe trend analysis from daily prices. |
| `isFullyAligned()` | Check if all timeframes agree on direction. |

**Types:** `TimeframeTrend`, `MultiTrendResult`

---

### Supertrend Calculator

**File:** `src/domain/supertrend-calculator.ts`

SuperTrend — Pure domain logic. Ported from Dart: lib/src/domain/supertrend_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeSuperTrendSeries()` | — |
| `computeSuperTrend()` | — |

**Types:** `SuperTrendPoint`

---

### Trend Strength

**File:** `src/domain/trend-strength.ts`

Trend Strength Composite (TSC) — unified 0-100 trend strength score.

**Functions:**

| Function | Description |
| --- | --- |
| `computeTrendStrength()` | Trend Strength Composite (TSC) — unified 0-100 trend strength score. |

**Types:** `TrendStrengthPoint`, `TrendStrengthOptions`

---

### Turtle Trading

**File:** `src/domain/turtle-trading.ts`

Turtle Trading System — Donchian breakout trend-following with position sizing. Based on the classic Richard Dennis turtle trader rules.

**Functions:**

| Function | Description |
| --- | --- |
| `donchianChannel()` | Turtle Trading System — Donchian breakout trend-following with position sizing. Based on the classic Richard Dennis turtle trader rules. |
| `computeATR()` | Compute Average True Range. |
| `turtleTrading()` | Run Turtle Trading system on OHLC data. |

**Types:** `TurtleConfig`, `TurtleSignal`, `TurtleResult`

---

### Wma

**File:** `src/domain/wma.ts`

Weighted Moving Average. Linearly weighted: most recent bar has the largest weight `period`, oldest bar has weight 1. Sum of weights = period*(period+1)/2. WMA[i] = sum(close[i-period+1..i] * (1..period)) / (period*(period+1)/2)

**Functions:**

| Function | Description |
| --- | --- |
| `computeWma()` | Weighted Moving Average. Linearly weighted: most recent bar has the largest weight `period`, oldest bar has weight 1. Sum of weights = period*(period+1)/2. WMA[i] = sum(close[i-period+1..i] * (1..period)) / (period*(period+1)/2) |

---

## ⚡ Volatility Indicators

### Atr Calculator

**File:** `src/domain/atr-calculator.ts`

ATR Calculator — Average True Range. Ported from Dart: lib/src/domain/atr_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeAtrSeries()` | — |
| `computeAtr()` | — |

**Types:** `AtrPoint`

---

### Atr Trailing Stop

**File:** `src/domain/atr-trailing-stop.ts`

ATR trailing stop — dynamic stop-loss levels based on Average True Range for volatility-adjusted exits.

**Functions:**

| Function | Description |
| --- | --- |
| `trueRange()` | ATR trailing stop — dynamic stop-loss levels based on Average True Range for volatility-adjusted exits. |
| `atr()` | Compute ATR (Average True Range) over a period. |
| `longTrailingStop()` | Compute ATR trailing stop for a long position. Stop is placed `multiplier * ATR` below the highest close. |
| `shortTrailingStop()` | Compute ATR trailing stop for a short position. Stop is placed `multiplier * ATR` above the lowest close. |
| `trailingStopSeries()` | Compute a series of trailing stop levels (for charting). |

**Types:** `Candle`, `TrailingStopResult`

---

### Bollinger Calculator

**File:** `src/domain/bollinger-calculator.ts`

Bollinger Bands Calculator — Pure domain logic. Ported from Dart: lib/src/domain/bollinger_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeBollingerSeries()` | — |
| `computeBollinger()` | — |

**Types:** `BollingerPoint`

---

### Dema Tema

**File:** `src/domain/dema-tema.ts`

DEMA / TEMA — Patrick Mulloy (1994). Reduce EMA lag. DEMA = 2*EMA  - EMA(EMA) TEMA = 3*EMA  - 3*EMA(EMA) + EMA(EMA(EMA))

**Functions:**

| Function | Description |
| --- | --- |
| `computeDema()` | — |
| `computeTema()` | — |

---

### Garch

**File:** `src/domain/garch.ts`

GARCH(1,1) volatility model — Generalized Autoregressive Conditional Heteroskedasticity. Models time-varying volatility with clustering effects.

**Functions:**

| Function | Description |
| --- | --- |
| `estimateGarch()` | GARCH(1,1) volatility model — Generalized Autoregressive Conditional Heteroskedasticity. Models time-varying volatility with clustering effects. |
| `garchVolatility()` | GARCH(1,1) log-likelihood (Gaussian). |
| `garchForecast()` | Forecast future volatility N steps ahead. |
| `garchAnalysis()` | Full GARCH analysis. |

**Types:** `GarchParams`, `GarchResult`

---

### Garman Klass

**File:** `src/domain/garman-klass.ts`

Garman-Klass and related intraday volatility estimators. More efficient than close-to-close because they use OHLC data.

**Functions:**

| Function | Description |
| --- | --- |
| `garmanKlassSingle()` | Garman-Klass and related intraday volatility estimators. More efficient than close-to-close because they use OHLC data. |
| `garmanKlassVol()` | Garman-Klass annualized volatility over a series of OHLC bars. |
| `parkinsonVol()` | Parkinson volatility estimator (uses only high and low). More efficient than close-to-close by factor of ~5. |
| `rogersSatchellVol()` | Rogers-Satchell volatility estimator (drift-independent). |
| `yangZhangVol()` | Yang-Zhang volatility estimator (handles overnight gaps). Combines overnight, open-to-close, and Rogers-Satchell components. |
| `compareEstimators()` | Compare all estimators for the same data. |

**Types:** `OHLCBar`

---

### Hawkes Process

**File:** `src/domain/hawkes-process.ts`

Hawkes process — self-exciting point process for event clustering. Models how past events increase probability of future events (e.g., volatility clustering).

**Functions:**

| Function | Description |
| --- | --- |
| `fitHawkes()` | Hawkes process — self-exciting point process for event clustering. Models how past events increase probability of future events (e.g., volatility clustering). |
| `simulateHawkes()` | Simulate a Hawkes process via thinning algorithm. |
| `hawkesIntensity()` | Compute time-varying intensity of a Hawkes process at given evaluation points. |

**Types:** `HawkesParams`, `HawkesResult`

---

### Implied Volatility

**File:** `src/domain/implied-volatility.ts`

Implied volatility surface — construct vol smile/skew from option prices. Uses Newton-Raphson for IV extraction and interpolates across strikes/expiries.

**Functions:**

| Function | Description |
| --- | --- |
| `impliedVolatility()` | Implied volatility surface — construct vol smile/skew from option prices. Uses Newton-Raphson for IV extraction and interpolates across strikes/expiries. |
| `buildVolSurface()` | Build a volatility surface from multiple option quotes. |
| `blackScholes()` | Black-Scholes option price. |

**Types:** `OptionQuote`, `IVPoint`, `VolSurface`

---

### Keltner

**File:** `src/domain/keltner.ts`

Keltner channels: EMA midline ± multiplier × ATR. Common defaults are length=20, atrLength=10, multiplier=2.

**Functions:**

| Function | Description |
| --- | --- |
| `computeKeltner()` | — |

**Types:** `KeltnerPoint`, `KeltnerOptions`

---

### Markov Chain

**File:** `src/domain/markov-chain.ts`

Markov chain model — state transition probability matrices for market regimes. Estimates regime switching probabilities from observed state sequences.

**Functions:**

| Function | Description |
| --- | --- |
| `estimateTransitionMatrix()` | Markov chain model — state transition probability matrices for market regimes. Estimates regime switching probabilities from observed state sequences. |
| `stationaryDistribution()` | Compute stationary distribution π such that πP = π. Uses power iteration. |
| `meanRecurrenceTime()` | Compute mean first passage times from state i to state j. M_ij = expected number of steps to reach j starting from i. For recurrence: M_ii = 1/π_i |
| `classifyRegimes()` | Classify market returns into discrete regime states. Simple threshold-based classification. |
| `buildMarkovChain()` | Build complete Markov chain model from returns. |
| `simulateMarkovChain()` | Simulate future states from a Markov chain. |

**Types:** `MarkovChain`, `RegimeSequence`

---

### Ornstein Uhlenbeck

**File:** `src/domain/ornstein-uhlenbeck.ts`

Ornstein-Uhlenbeck (OU) process — mean-reversion parameter estimation. Models: dX = θ(μ - X)dt + σ dW Parameters: θ (speed), μ (long-run mean), σ (volatility)

**Functions:**

| Function | Description |
| --- | --- |
| `estimateOU()` | Ornstein-Uhlenbeck (OU) process — mean-reversion parameter estimation. Models: dX = θ(μ - X)dt + σ dW Parameters: θ (speed), μ (long-run mean), σ (volatility) |
| `ouAnalysis()` | Full OU analysis with goodness-of-fit. |
| `simulateOU()` | Simulate OU process forward from current value. |
| `expectedTimeToMean()` | Expected time to mean from current level. |

**Types:** `OUParams`, `OUResult`

---

### Realized Volatility

**File:** `src/domain/realized-volatility.ts`

Realized volatility estimators — range-based and tick-based vol measures. Parkinson, Rogers-Satchell, and Yang-Zhang estimators. (Garman-Klass is in a separate module.)

**Functions:**

| Function | Description |
| --- | --- |
| `parkinsonVol()` | Realized volatility estimators — range-based and tick-based vol measures. Parkinson, Rogers-Satchell, and Yang-Zhang estimators. (Garman-Klass is in a separate module.) |
| `rogersSatchellVol()` | Rogers-Satchell (1991) — accounts for drift, uses OHLC. |
| `yangZhangVol()` | Yang-Zhang (2000) — combines overnight, open-to-close, and Rogers-Satchell. Most efficient for OHLC data; handles opening jumps. |
| `closeToCloseVol()` | Standard close-to-close historical volatility. |
| `allVolEstimates()` | Compute all volatility estimators for comparison. |

**Types:** `OHLCBar`, `VolEstimates`

---

### Volatility Cone

**File:** `src/domain/volatility-cone.ts`

Volatility cone — term structure of realized volatility at different lookback periods compared to historical percentiles.

**Functions:**

| Function | Description |
| --- | --- |
| `realizedVol()` | Volatility cone — term structure of realized volatility at different lookback periods compared to historical percentiles. |
| `historicalVolDistribution()` | Compute historical distribution of realized vol for a given period. |
| `buildVolatilityCone()` | Compute percentile from sorted array. |
| `volPercentileRank()` | Get current volatility percentile rank for a given period. |

**Types:** `VolatilityConePoint`, `VolatilityConeResult`

---

### Volatility Rank

**File:** `src/domain/volatility-rank.ts`

Volatility rank calculator — compute and rank tickers by historical volatility (standard deviation of returns) for risk assessment.

**Functions:**

| Function | Description |
| --- | --- |
| `dailyReturns()` | Volatility rank calculator — compute and rank tickers by historical volatility (standard deviation of returns) for risk assessment. |
| `standardDeviation()` | Compute standard deviation of a numeric array. |
| `annualizedVolatility()` | Compute annualized volatility from a price series. Returns as percentage (e.g., 25 for 25% annual vol). |
| `dailyVolatility()` | Compute daily volatility from a price series. Returns as percentage. |
| `rankByVolatility()` | Rank multiple tickers by volatility (most volatile first). |
| `classifyVolatility()` | Classify volatility level. |
| `getLeastVolatile()` | Get the least volatile tickers (for conservative portfolios). |

**Types:** `VolatilityRank`

---

## 📦 Volume Indicators

### Ad Line

**File:** `src/domain/ad-line.ts`

Accumulation/Distribution Line (Marc Chaikin). Cumulative volume-weighted money-flow indicator: MFM    = ((close - low) - (high - close)) / (high - low)   (0 if h===l) MFV    = MFM * volume AD[i]  = AD[i-1] + MFV[i]   with AD[-1] = 0

**Functions:**

| Function | Description |
| --- | --- |
| `computeAdLine()` | — |

**Types:** `AdCandle`

---

### Anchored Vwap

**File:** `src/domain/anchored-vwap.ts`

Anchored VWAP: cumulative volume-weighted average price starting at a chosen anchor index/time. Optional standard-deviation bands. Uses typical price (H+L+C)/3 weighted by volume.

**Functions:**

| Function | Description |
| --- | --- |
| `anchoredVwap()` | — |

**Types:** `AnchoredVwapPoint`, `AnchoredVwapOptions`

---

### Chaikin Money Flow

**File:** `src/domain/chaikin-money-flow.ts`

Chaikin Money Flow (Marc Chaikin). For each bar: MFM = ((C - L) - (H - C)) / (H - L)   // Money Flow Multiplier MFV = MFM * Volume                     // Money Flow Volume CMF(n) = sum(MFV, n) / sum(Volume, n). Range: [-1, 1]. Positive → buying pressure, negative → selling.

**Functions:**

| Function | Description |
| --- | --- |
| `computeChaikinMoneyFlow()` | — |

**Types:** `CmfPoint`

---

### Ease Of Movement

**File:** `src/domain/ease-of-movement.ts`

Richard Arms' Ease of Movement (EOM, EMV). Highlights how easily price moves on a given volume. Positive when price rises with low volume; negative when it falls. Typically smoothed by an SMA.

**Functions:**

| Function | Description |
| --- | --- |
| `computeEaseOfMovement()` | — |

**Types:** `EaseOfMovementOptions`

---

### Force Index

**File:** `src/domain/force-index.ts`

Force Index (Alexander Elder, 1993). Combines price change and volume to gauge the power behind a move. raw[i]    = (close[i] - close[i-1]) * volume[i] smoothed  = EMA(raw, period)   (typical period: 13) raw[0] is null (no prior close).

**Functions:**

| Function | Description |
| --- | --- |
| `computeForceIndexRaw()` | — |
| `computeForceIndex()` | — |

**Types:** `ForceCandle`

---

### Mfi Calculator

**File:** `src/domain/mfi-calculator.ts`

MFI (Money Flow Index) — Pure domain logic. Ported from Dart: lib/src/domain/mfi_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeMfiSeries()` | — |
| `computeMfi()` | — |

**Types:** `MfiPoint`

---

### Obv Calculator

**File:** `src/domain/obv-calculator.ts`

OBV (On-Balance Volume) — Pure domain logic. Ported from Dart: lib/src/domain/obv_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeObvSeries()` | — |
| `computeObv()` | — |

**Types:** `ObvPoint`

---

### Order Flow

**File:** `src/domain/order-flow.ts`

Order flow imbalance — buy/sell pressure from tick-level trade classification. Implements Lee-Ready tick rule, bulk volume classification, and VPIN.

**Functions:**

| Function | Description |
| --- | --- |
| `tickRuleClassify()` | Order flow imbalance — buy/sell pressure from tick-level trade classification. Implements Lee-Ready tick rule, bulk volume classification, and VPIN. |
| `bulkVolumeClassify()` | Bulk Volume Classification (BVC) — probabilistic trade classification. Uses normalized price change to estimate buy probability. |
| `orderFlowImbalance()` | Compute order flow imbalance metrics from classified trades. |
| `computeVPIN()` | Volume-Synchronized Probability of Informed Trading (VPIN). Groups trades into volume buckets and measures imbalance across buckets. |
| `flowBuckets()` | Compute flow buckets for visualization/analysis. |

**Types:** `Trade`, `OrderFlowMetrics`, `FlowBucket`

---

### Relative Volume

**File:** `src/domain/relative-volume.ts`

Relative Volume (RVOL) — compare current volume to historical average.

**Functions:**

| Function | Description |
| --- | --- |
| `computeRelativeVolume()` | Relative Volume (RVOL) — compare current volume to historical average. |
| `detectVolumeSurges()` | Detect volume surge events (RVOL above threshold). |

**Types:** `RvolPoint`, `RvolOptions`

---

### Snapshot Diff

**File:** `src/domain/snapshot-diff.ts`

Data snapshot diffing — compare two point-in-time ticker data snapshots to highlight what changed (price, volume, signal flips).

**Functions:**

| Function | Description |
| --- | --- |
| `diffSnapshots()` | Data snapshot diffing — compare two point-in-time ticker data snapshots to highlight what changed (price, volume, signal flips). |
| `summarizeDiff()` | Get a summary of the diff. |
| `getSignificantMovers()` | Filter diffs to only significant movers (above threshold %). |
| `sortByLargestMove()` | Get diffs sorted by absolute price change descending. |
| `getSignalFlips()` | Get only signal flip diffs. |

**Types:** `TickerData`, `SnapshotDiff`, `DiffSummary`

---

### Time Segmented Volume

**File:** `src/domain/time-segmented-volume.ts`

Time-Segmented Volume (TSV) — Worden Brothers accumulation/distribution.

**Functions:**

| Function | Description |
| --- | --- |
| `computeTsv()` | Time-Segmented Volume (TSV) — Worden Brothers accumulation/distribution. |

**Types:** `TsvPoint`, `TsvOptions`

---

### Volume Profile

**File:** `src/domain/volume-profile.ts`

Volume profile (price-by-volume): bins each candle's volume across its high-low range and aggregates per price bin. Returns POC (point of control) and value area (VA) bounds covering `valueAreaPct` of total volume.

**Functions:**

| Function | Description |
| --- | --- |
| `computeVolumeProfile()` | — |

**Types:** `VolumeProfileBin`, `VolumeProfile`, `VolumeProfileOptions`

---

### Vwap Calculator

**File:** `src/domain/vwap-calculator.ts`

VWAP Calculator — Volume-Weighted Average Price. Ported from Dart: lib/src/domain/vwap_calculator.dart

**Functions:**

| Function | Description |
| --- | --- |
| `computeVwapSeries()` | — |
| `computeVwap()` | — |

**Types:** `VwapPoint`

---

### Vwap

**File:** `src/domain/vwap.ts`

Volume-weighted price calculations — VWAP and TWAP from intraday price/volume data.

**Functions:**

| Function | Description |
| --- | --- |
| `vwap()` | Volume-weighted price calculations — VWAP and TWAP from intraday price/volume data. |
| `runningVwap()` | Running VWAP series (cumulative at each bar). |
| `vwapWithBands()` | VWAP with standard deviation bands. |
| `twap()` | Compute TWAP (time-weighted average price) from timed prices. |
| `simpleTwap()` | Simple TWAP from evenly-spaced prices. |
| `vwapDeviation()` | Deviation from VWAP in percent. |

**Types:** `PriceVolume`, `TimedPrice`, `VwapResult`

---
