/**
 * Browser-only domain helpers that depend on Web APIs or browser runtimes.
 *
 * @module domain/browser
 */

export {
  onnxSupported,
  preprocessCandles,
  softmax,
  argmax,
  topK,
  buildInputTensor,
  createModelLoader,
} from "./_experimental/onnx-patterns";
export type {
  OnnxCandle,
  ModelLoaderOptions,
  ModelSession,
  TopKResult,
  TensorSpec,
  OrtLike,
} from "./_experimental/onnx-patterns";

export { createMarketDataEnvelope } from "../types/market-data";
export type {
  MarketDataKind,
  MarketDataStatus,
  MarketDataProvenance,
  MarketDataEnvelope,
} from "../types/market-data";
