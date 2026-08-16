# ADR-0022: WebLLM, Local Embeddings, And Signal DSL Assistance Evaluation

- **Status:** Accepted (decision: do not implement yet — criteria and triggers only)
- **Date:** 2026-08-16
- **Owner:** Architecture maintainers
- **Related roadmap:** R01
- **Related:** [ADR-0018: AI feature boundary](0018-ai-feature-boundary.md)

## Context

R01 asks CrossTide to evaluate WebLLM, local embeddings, and Signal DSL assistance
(natural-language-to-DSL translation, or "explain this expression" style help) before
any implementation. `src/core/ai-disclaimer.ts` already reserves `AiFeatureId` values
for `webllm` and `signal-dsl-translate`, anticipating this evaluation, but no AI
producer exists in the shipped product today — [ADR-0018](0018-ai-feature-boundary.md)
defers the disclaimer framework's activation until one is accepted.

This ADR is the evaluation record R01 requires. It is deliberately **not** a
browser-benchmarked feasibility study: no build in this repository currently bundles
WebLLM or a local embedding model, and this session had no browser instrumented to
measure real WebGPU inference latency, memory pressure, or download behavior on
representative hardware. Writing fabricated numbers here would fail the project's own
standard (`copilot-instructions.md` learning 23 — "a check that cannot observe the
thing it names is decorative"). Instead, this ADR records the evaluation criteria and
the known structural constraints, and names the exact browser evidence a future
implementation ADR must collect before shipping.

## Options considered

### 1. WebLLM (in-browser LLM inference via WebGPU)

- **Capability:** could power "explain this consensus signal" or "draft a Signal DSL
  expression from a description" without sending data to a third-party API.
- **Model size:** WebLLM's smallest practical quantized models are tens to low
  hundreds of MB — one to three orders of magnitude larger than CrossTide's entire
  250 KB gzip production bundle budget (`npm run check:bundle`, `docs/ROADMAP.md`
  Phase 5 F01). It cannot be part of the default bundle under any plausible
  configuration; it would have to be a fully separate, explicitly opted-in download.
- **Browser support:** depends on WebGPU, which is not available in every browser
  and configuration CrossTide currently targets per `docs/COMPATIBILITY-MATRIX.md`.
  Any implementation needs a real feature-detection fallback path, not a
  browser-sniffed allowlist.
- **Privacy:** the strongest option for the "no data leaves the browser" property
  the rest of CrossTide already holds (see `docs/adr/0017-threat-model.md`) —
  once downloaded, inference is local.
- **Safety:** requires the full `ai-disclaimer.ts` consent and disclosure flow;
  free-text LLM output about financial data must never be presented without the
  "not financial advice" framing already defined there.

### 2. Local embeddings (small in-browser embedding model)

- **Capability:** could support semantic ticker/indicator search or similarity-based
  screener suggestions.
- **Model size:** smaller than a full LLM (single-digit to low tens of MB depending
  on quantization) but still far above the bundle budget; same opt-in-download
  constraint as WebLLM.
- **Browser support:** broader than WebGPU-dependent WebLLM if implemented with
  WASM/ONNX Runtime Web instead, at a performance cost that has not been measured
  in this repository.
- **Privacy/Safety:** same local-only property as WebLLM; substantially lower
  safety risk since embeddings do not generate free text.

### 3. Signal DSL assistance (rule-based or template-driven, no model)

- **Capability:** `src/domain/signal-dsl.ts` already defines the expression grammar.
  A non-AI assistance layer (autocomplete from the known operator/field set, inline
  validation errors, example templates) can cover most of the "help me write an
  expression" need without any model at all.
- **Model size / browser support / privacy / safety:** not applicable — this is
  deterministic tooling, not an AI feature, and needs no `ai-disclaimer.ts` gate.

## Decision

1. **Do not implement WebLLM or local embeddings now.** Neither has browser-measured
   evidence in this repository, and both fail the bundle-budget constraint by a wide
   margin as a default-on feature. Implementation remains blocked until an
   implementation ADR supersedes this one with real evidence (see triggers below).
2. **Signal DSL assistance should be pursued first, without a model.** It closes the
   most concrete part of R01's motivation (users struggling to write DSL expressions)
   using tooling already proven safe and inexpensive in this codebase: static
   grammar-driven autocomplete and inline validation, not free-text generation. This
   is a separate, ordinary feature-work item, not gated by this ADR or by
   `ai-disclaimer.ts`, because it produces no AI-generated content.
3. **A future WebLLM or local-embeddings proposal must be its own ADR** and must
   include, at minimum:
   - A real bundle-size and lazy-load measurement (opt-in download path only —
     never counted against the default `check:bundle` budget).
   - Measured inference latency and memory use on at least one representative
     low-end device profile, consistent with the profiling discipline already
     established for F02.
   - A named model, license, and provenance (no undisclosed third-party model
     swap after ship).
   - A completed `ai-disclaimer.ts` wiring: `requireConsent` before first use,
     `wrapWithDisclaimer` on every output, and a capability-matrix entry that
     classifies it independently from CrossTide's deterministic analysis features
     (per [ADR-0018](0018-ai-feature-boundary.md)).
   - A documented fallback for browsers/devices without WebGPU (or without enough
     memory for the model), so the feature degrades to "unavailable here" rather
     than failing silently or blocking the rest of the app.

## Consequences

- R01 moves from "no evaluation exists" to "evaluation criteria and a scoped
  first deliverable exist" — it is not closed, because the roadmap's own acceptance
  evidence ("ADR records capability **and browser evidence**") explicitly requires
  measurements this session could not produce honestly.
- Signal DSL assistance can proceed as ordinary, non-AI feature work without waiting
  on a model decision.
- Any contributor proposing WebLLM or local embeddings has a concrete evidence bar to
  clear before writing implementation code, preventing an under-measured model
  integration from silently blowing the bundle budget or shipping without the
  consent framework `ai-disclaimer.ts` already defines.

## Related

- `docs/ROADMAP.md` Phase 9 (R01)
- [ADR-0018: AI feature boundary](0018-ai-feature-boundary.md)
- [ADR-0017: Threat model](0017-threat-model.md)
- [ADR-0021: Framework, storage, hosting reassessment criteria](0021-framework-storage-hosting-reassessment.md) (same "trigger before migration" shape)
- `src/core/ai-disclaimer.ts`, `src/domain/signal-dsl.ts`
