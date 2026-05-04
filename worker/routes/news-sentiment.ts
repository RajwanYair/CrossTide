/**
 * News Sentiment Scoring — R5.
 *
 * Server-side NLP-based sentiment analysis for news headlines and snippets.
 * Uses an expanded VADER-inspired lexicon with intensity modifiers, negation
 * handling, and financial domain terms. Runs in the Worker so the browser
 * doesn't need to ship the lexicon.
 *
 * POST /api/news/sentiment
 * Body: { texts: string[] }
 * Response: { results: SentimentResult[] }
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SentimentResult {
  text: string;
  score: number; // [-1, 1]
  label: "bullish" | "bearish" | "neutral";
  confidence: number; // [0, 1]
}

export interface SentimentRequest {
  texts: string[];
}

export interface SentimentResponse {
  results: SentimentResult[];
}

// ── Lexicon ───────────────────────────────────────────────────────────────────

/** Word → valence score in [-4, 4]. Inspired by VADER + financial domain. */
const LEXICON: Record<string, number> = {
  // Strong bullish
  surge: 3.2,
  soar: 3.0,
  rally: 2.8,
  breakout: 2.5,
  boom: 2.7,
  skyrocket: 3.5,
  moonshot: 3.3,
  upgrade: 2.2,
  outperform: 2.0,
  bullish: 2.5,
  beat: 1.8,
  exceeded: 2.0,
  record: 1.5,
  gains: 2.0,
  profit: 1.8,
  growth: 1.5,
  strong: 1.5,
  positive: 1.3,
  optimistic: 1.8,
  upside: 2.0,
  recovery: 1.5,
  rebound: 2.0,
  momentum: 1.3,
  dividend: 1.0,
  buyback: 1.5,
  expansion: 1.3,
  innovation: 1.2,
  revenue: 0.8,
  earnings: 0.5,
  // Moderate bullish
  rise: 1.5,
  gain: 1.5,
  up: 1.0,
  higher: 1.2,
  improve: 1.3,
  advance: 1.0,
  steady: 0.5,
  stable: 0.5,
  buy: 1.5,
  accumulate: 1.0,
  // Strong bearish
  crash: -3.5,
  plunge: -3.2,
  collapse: -3.0,
  tank: -2.8,
  tumble: -2.5,
  selloff: -2.8,
  downgrade: -2.2,
  bearish: -2.5,
  bankruptcy: -3.5,
  fraud: -3.5,
  default: -3.0,
  recession: -2.5,
  crisis: -2.8,
  slump: -2.5,
  losses: -2.0,
  loss: -1.8,
  decline: -1.5,
  negative: -1.3,
  pessimistic: -1.8,
  downside: -2.0,
  miss: -1.8,
  missed: -1.8,
  warning: -1.5,
  risk: -1.0,
  layoff: -2.0,
  layoffs: -2.2,
  investigation: -1.5,
  lawsuit: -1.5,
  debt: -1.0,
  inflation: -1.2,
  // Moderate bearish
  fall: -1.5,
  drop: -1.5,
  down: -1.0,
  lower: -1.2,
  weak: -1.5,
  sell: -1.5,
  cut: -1.0,
  reduce: -0.8,
  concern: -1.0,
  volatile: -0.8,
  uncertainty: -1.0,
};

/** Intensity boosters — amplify the next sentiment word by ~1.3x. */
const BOOSTERS = new Set([
  "very",
  "extremely",
  "significantly",
  "dramatically",
  "sharply",
  "massive",
  "huge",
  "major",
  "strongly",
  "heavily",
]);

/** Negation words — flip sentiment of the next word. */
const NEGATORS = new Set([
  "not",
  "no",
  "never",
  "neither",
  "barely",
  "hardly",
  "without",
  "despite",
  "isn't",
  "wasn't",
  "aren't",
  "doesn't",
  "didn't",
  "won't",
  "cannot",
  "can't",
]);

// ── Scoring engine ────────────────────────────────────────────────────────────

/**
 * Compute sentiment score for a single text using VADER-inspired approach.
 * Returns score in [-1, 1].
 */
export function analyzeText(text: string): SentimentResult {
  const words = text
    .toLowerCase()
    .replace(/['']/g, "'")
    .split(/[^a-z']+/)
    .filter(Boolean);

  if (words.length === 0) {
    return { text, score: 0, label: "neutral", confidence: 0 };
  }

  let totalValence = 0;
  let wordCount = 0;
  let negateNext = false;
  let boostNext = false;

  for (const word of words) {
    // Check for negation/booster modifiers
    if (NEGATORS.has(word)) {
      negateNext = true;
      continue;
    }
    if (BOOSTERS.has(word)) {
      boostNext = true;
      continue;
    }

    const valence = LEXICON[word];
    if (valence !== undefined) {
      let adjusted = valence;
      if (boostNext) adjusted *= 1.3;
      if (negateNext) adjusted *= -0.75;
      totalValence += adjusted;
      wordCount++;
    }

    // Reset modifiers after a scored word or 2 non-scored words
    negateNext = false;
    boostNext = false;
  }

  // Normalize using a sigmoid-like function to keep in [-1, 1]
  const rawScore = wordCount > 0 ? totalValence / Math.sqrt(wordCount) : 0;
  const score = rawScore / Math.sqrt(rawScore * rawScore + 4);

  // Confidence based on how many sentiment words were found relative to text length
  const confidence = Math.min(1, wordCount / Math.max(1, words.length / 3));

  const label = score > 0.1 ? "bullish" : score < -0.1 ? "bearish" : "neutral";

  return {
    text,
    score: Math.round(score * 1000) / 1000,
    label,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Batch-analyze multiple texts.
 */
export function analyzeBatch(texts: readonly string[]): SentimentResult[] {
  return texts.map(analyzeText);
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * Handle POST /api/news/sentiment
 * Expects JSON body: { texts: string[] }
 * Max 50 texts per request to prevent abuse.
 */
export async function handleNewsSentiment(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body || typeof body !== "object" || !Array.isArray((body as SentimentRequest).texts)) {
    return new Response(JSON.stringify({ error: "Expected { texts: string[] }" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const texts = (body as SentimentRequest).texts;
  if (texts.length > 50) {
    return new Response(JSON.stringify({ error: "Max 50 texts per request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate all entries are strings
  const validTexts = texts.filter((t): t is string => typeof t === "string").slice(0, 50);
  const results = analyzeBatch(validTexts);

  return new Response(JSON.stringify({ results } satisfies SentimentResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
