export {
  signal,
  computed,
  effect,
  untracked,
  batch,
  persistedSignal,
  localStorageAdapter,
} from "./signals";
export type {
  ReadSignal,
  WriteSignal,
  SignalOptions,
  PersistAdapter,
  PersistedSignalOptions,
} from "./signals";
export { Cache } from "./cache";
export { LruCache } from "./lru-cache";
export type { LruCacheOptions } from "./lru-cache";
export {
  loadConfig,
  saveConfig,
  addTicker,
  removeTicker,
  setCardSetting,
  getCardSetting,
} from "./config";
export { fetchWithTimeout, fetchWithRetry, fetchConditional, FetchError } from "./fetch";
export { fetchOnce, inflightCount, clearInflight } from "./fetch-dedup";
export {
  getValidators,
  setValidators,
  buildConditionalHeaders,
  clearValidators,
} from "./http-validator-cache";
export type { HttpValidators } from "./http-validator-cache";
export { toDisposable, abortOnDispose, onRouteChangeDisposable } from "./disposable";
export type { SyncDisposable, DisposableAbortController } from "./disposable";
export { createShortcutManager } from "./keyboard";
export type { Shortcut } from "./keyboard";
export { openIDB } from "./idb";
export type { IDB } from "./idb";
export { TieredCache } from "./tiered-cache";
export {
  exportConfigJSON,
  importConfigJSON,
  exportWatchlistCSV,
  importWatchlistCSV,
  downloadFile,
  downloadCompressedFile,
} from "./export-import";
export type { ExportPayload } from "./export-import";
export { installErrorBoundary, getErrorLog, clearErrorLog } from "./error-boundary";
export type { ErrorRecord, ErrorHandler } from "./error-boundary";
export { initTelemetry, getTelemetry, _resetTelemetryForTests } from "./telemetry";
export type { TelemetryHandle } from "./telemetry";
export {
  isPushSupported,
  subscribeToPush,
  unsubscribePush,
  showLocalNotification,
  urlBase64ToUint8Array,
  arrayBufferToBase64,
} from "./push-notifications";
export type { PushSubscriptionPayload, LocalNotificationOptions } from "./push-notifications";
export {
  format as formatIcu,
  formatMessage,
  defineMessages,
  getPluralCategory,
} from "./icu-formatter";
export type { MessageValues, MessageDict } from "./icu-formatter";
export {
  isPasskeySupported,
  registerPasskey,
  authenticatePasskey,
  storePasskeyId,
  getStoredPasskeyId,
  clearPasskeyId,
  bufferToBase64Url,
  base64UrlToBuffer,
} from "./passkey";
export type {
  RegisterPasskeyOptions,
  RegisterPasskeyResult,
  AuthenticatePasskeyOptions,
  AuthenticatePasskeyResult,
} from "./passkey";
export { registerServiceWorker } from "./sw-register";
export { watchServiceWorkerUpdates } from "./sw-update";
export type { SwUpdateHandle, SwUpdateOptions } from "./sw-update";
export {
  backgroundFetchSupported,
  startArchiveDownload,
  getActiveFetches,
  onFetchProgress,
  fetchWithFallback,
} from "./background-fetch";
export type { ArchiveDownloadOptions, FetchProgress, ProgressCallback } from "./background-fetch";
export {
  CACHE_VERSION,
  CACHE_NAMES,
  EXPIRATION_CONFIGS,
  NETWORK_TIMEOUT_SECONDS,
  BG_SYNC_QUEUE_NAME,
  BG_SYNC_MAX_RETENTION_MINUTES,
  shouldUseNetworkFirst,
  shouldUseStaleWhileRevalidate,
  shouldUseCacheFirst,
  getExpirationConfig,
} from "./sw-cache-config";
export type { CacheType, ExpirationConfig } from "./sw-cache-config";
export { createSyncQueue } from "./sync-queue";
export type { QueuedRequest, SyncQueue, SyncQueueOptions } from "./sync-queue";
export {
  encodeShareState,
  decodeShareState,
  buildShareUrl,
  readShareUrl,
  encodeWatchlistUrl,
  decodeWatchlistUrl,
  WATCHLIST_MAX_TICKERS,
} from "./share-state";
export type { ShareState } from "./share-state";
export {
  buildCsp,
  buildPermissionsPolicy,
  buildSecurityHeaders,
  generateNonce,
} from "./csp-builder";
export type { CspOptions, SecurityHeaders } from "./csp-builder";
export { computeIntegrity, integrityAttr, isValidSriValue, buildSriManifest } from "./sri";
export type { SriAlgorithm } from "./sri";
export { latestVersion, validateMigrations, applyMigrations } from "./idb-migrations";
export type { SchemaMigration } from "./idb-migrations";
export { decide as decideTierPolicy } from "./tier-policy";
export type { Tier, AccessRecord, PolicyOptions, PolicyDecision } from "./tier-policy";
export { createReconnectingWS, nextBackoff } from "./reconnecting-ws";
export type { ReconnectingWS, ReconnectOptions, WSEventHandler } from "./reconnecting-ws";
export { optimisticMutation, withPayload } from "./optimistic";
export type { MutationStore, MutationOptions, MutationResult } from "./optimistic";
export { parseCsv, parseCsvAsObjects, serializeCsv, serializeObjects } from "./csv";
export type { CsvRow, CsvParseOptions, CsvObjectsOptions, CsvSerializeOptions } from "./csv";
export { createStoragePressureMonitor, requestPersistentStorage } from "./storage-pressure";
export type {
  StorageEstimate,
  StoragePressureOptions,
  StoragePressureMonitor,
} from "./storage-pressure";
export { observeWebVitals, makeBeaconReporter } from "./web-vitals";
export type { VitalName, VitalReport, VitalHandler, VitalsObserver } from "./web-vitals";
export { createAnalyticsClient } from "./analytics-client";
export type { AnalyticsConfig, AnalyticsClient } from "./analytics-client";
export {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from "./notifications";
export type { NotificationPermissionState, AppNotificationOptions } from "./notifications";
export { createWorkerClient, serveWorkerRpc } from "./worker-rpc";
export type {
  RpcRequest,
  RpcResponse,
  RpcError,
  RpcMessage,
  WorkerApi,
  WorkerClient,
} from "./worker-rpc";
export {
  STRIDE,
  Field,
  packOhlcv,
  unpackOhlcv,
  extractColumn,
  packFromColumns,
  slicePacked,
  collectTransferables,
} from "./transferable-ohlc";
export type { OhlcvRow, PackedOhlcv } from "./transferable-ohlc";
export {
  API_VERSION,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  extractApiKey,
  validateApiKey,
  successEnvelope,
  errorEnvelope,
  rateLimitHeaders,
  corsHeaders,
  parsePagination,
  paginate,
  parseFields,
  pickFields,
  isValidTicker,
  isValidDateParam,
} from "./public-api";
export type {
  RateLimitInfo,
  ApiResponse,
  ApiMeta,
  PaginationParams,
  PaginatedMeta,
} from "./public-api";
export { createChannelManager, WS_OPEN } from "./ws-fanout";
export type { WsLike, ChannelStats, ManagerStats, ChannelManager } from "./ws-fanout";
export {
  createLwwRegister,
  updateRegister,
  mergeLwwRegisters,
  createGSet,
  gSetAdd,
  mergeGSets,
  createOrSet,
  orSetAdd,
  orSetRemove,
  orSetItems,
  mergeOrSets,
  mergeRegisterMaps,
  buildSyncEnvelope,
} from "./crdt-sync";
export type { LwwRegister, GSet, OrSetEntry, OrSet, SyncEnvelope, MergeReport } from "./crdt-sync";

export {
  isTauriEnv,
  getTauriInvoke,
  safeInvoke,
  getAppVersion,
  getAppInfo,
  setWindowTitle,
  resizeWindow,
  toggleFullscreen,
  setAlwaysOnTop,
  minimizeToTray,
  parseDeepLink,
  buildTrayActions,
  defaultWindowOptions,
} from "./tauri-bridge";
export type {
  TauriInvoke,
  TauriEvent,
  WindowOptions,
  AppInfo,
  TrayAction,
  DeepLinkPayload,
} from "./tauri-bridge";

export { runBacktestAsync, disposeBacktestWorker } from "./backtest-worker";

export { fuzzyScore, fuzzySearch } from "./fuzzy-match";
export type { FuzzyMatch, FuzzyOptions } from "./fuzzy-match";

export { createCircuitBreaker } from "./circuit-breaker";
export type {
  CircuitBreaker,
  BreakerState,
  BreakerConfig,
  BreakerSnapshot,
} from "./circuit-breaker";

export { createTokenBucket } from "./token-bucket";
export type { TokenBucket, TokenBucketConfig } from "./token-bucket";

export { nextDelay, retry } from "./retry-backoff";
export type { BackoffPolicy, RetryOptions, Jitter } from "./retry-backoff";

export { debounce, throttle } from "./throttle-debounce";
export type { Cancellable } from "./throttle-debounce";

export { runPromisePool, runPromisePoolSettled } from "./promise-pool";
export type { PromisePoolOptions, SettledResult } from "./promise-pool";

export { createEventBus } from "./event-bus";
export type { EventBus, EventBusOptions, EventMap } from "./event-bus";

export { urlBuilder } from "./url-builder";
export type { UrlBuilder, QueryValue } from "./url-builder";

export { deepEqual } from "./deep-equal";

export {
  ok,
  err,
  isOk,
  isErr,
  map as mapResult,
  mapErr,
  andThen,
  unwrap,
  unwrapOr,
  tryCatch,
  tryCatchAsync,
} from "./result";
export type { Ok, Err, Result } from "./result";

export { lowerBound, upperBound, binarySearch } from "./binary-search";
export type { Comparator } from "./binary-search";

export { once, memoize } from "./once-memoize";
export type { MemoizedFn } from "./once-memoize";

export { safeParse, safeStringify } from "./safe-json";
export type { SafeResult, SafeStringifyOptions } from "./safe-json";

export { deepClone } from "./deep-clone";

export { chunk, window as windowSlide, zip } from "./chunk-array";

export { pick, omit, pickBy } from "./pick-omit";

export { djb2, djb2Hex, fnv1a32 } from "./hash-djb2";

export { mulberry32, randomInt, randomFloat, shuffle } from "./seedrandom";
export type { Rng } from "./seedrandom";

export {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  cubicBezier,
} from "./easing";
export type { EasingFn } from "./easing";

export { uuidV4, isUuidV4, nanoId } from "./uuid";

export {
  base64UrlEncode,
  base64UrlDecode,
  base64UrlEncodeBytes,
  base64UrlDecodeBytes,
} from "./base64-url";

export {
  currentTimeZone,
  timeZoneOffsetMinutes,
  formatInTimeZone,
  Temporal,
  toPlainDate,
  plainDateRange,
  addTradingDays,
} from "./timezone";

export { createCrossTabSync } from "./broadcast-channel";
export type {
  CrossTabSync,
  CrossTabMessage,
  CrossTabEventType,
  CrossTabConfigEvent,
} from "./broadcast-channel";

export {
  EXPORT_SCHEMA_VERSION,
  exportFullDataJson,
  importFullDataJson,
  exportFullDataCsv,
} from "./data-export";
export type { FullExportPayload, FullExportDomains } from "./data-export";

export {
  compressionStreamSupported,
  compressStringToGzip,
  estimateGzipRatio,
  gzipFilename,
} from "./compress";

export { createFinnhubStream } from "./finnhub-ws";
export type { FinnhubStream, FinnhubTradeTick, FinnhubStreamOptions } from "./finnhub-ws";

export {
  createStreamManager,
  getStoredFinnhubKey,
  clearStoredFinnhubKey,
  FINNHUB_KEY_STORAGE,
} from "./finnhub-stream-manager";
export type {
  StreamManager,
  StreamManagerOptions,
  StreamStatus,
  LiveTick,
} from "./finnhub-stream-manager";

export { generateOgImageSvg, svgToDataUri, downloadSvg } from "./og-image";
export type { OgImageOptions, ConsensusDirection } from "./og-image";

export {
  opfsSupported,
  writeCandles,
  readCandles,
  deleteCandles,
  listTickers,
  getArchiveSize,
  clearAllArchives,
  serializeCandles,
  deserializeCandles,
} from "./opfs-storage";
export type { OhlcvCandle } from "./opfs-storage";

export {
  getLocale,
  formatNumber,
  formatCompact,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTimeAgo,
} from "./i18n";
export type {
  NumberFormatOptions,
  CurrencyFormatOptions,
  PercentFormatOptions,
  DateFormatOptions,
  DateStyle,
  TimeStyle,
  RelativeTimeUnit,
  RelativeTimeOptions,
} from "./i18n";

export { t, registerCatalogue } from "./messages";
export type { Messages } from "./messages";

export { createApiClient, getApiClient, _resetApiClientForTests } from "./worker-api-client";
export type {
  WorkerApiClient,
  HealthResponse,
  ChartParams,
  ChartResponse,
  CandleRecord,
  SearchParams,
  SearchResponse,
  SearchHit,
  ScreenerParams,
  ScreenerResponse,
  ScreenerRow,
} from "./worker-api-client";

export {
  createWorkbook,
  addSheet,
  generateXlsx,
  cellRef,
  escapeXml,
  inferCellType,
} from "./xlsx-export";
export type { CellValue, SheetData, Workbook, CellType } from "./xlsx-export";

export { createCacheManager } from "./cache-manager";
export type { CacheTier, CacheManagerOptions, CacheManager, CacheStats } from "./cache-manager";

export {
  hashIp,
  startLogEntry,
  finalizeLogEntry,
  formatLogLine,
  statusToLevel,
} from "./request-logger";
export type { LogEntry, LogLevel, PendingLogEntry } from "./request-logger";

export {
  formatDate as formatDatePattern,
  isoDate,
  isoTime,
  isoDateTime,
  parseIsoDate,
  relativeTime,
  isWeekday,
  previousWeekday,
  nextWeekday,
  tradingDaysBetween,
} from "./date-format";

export {
  isAlertSoundEnabled,
  setAlertSoundEnabled,
  playAlertSound,
  disposeAlertSound,
} from "./alert-sound";

export {
  markFetched,
  getFreshness,
  getAllFreshness,
  resetFreshness,
  renderFreshnessBadge,
} from "./data-freshness";
export type { FreshnessLevel, FreshnessStatus } from "./data-freshness";
