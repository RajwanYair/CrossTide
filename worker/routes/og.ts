/**
 * GET /api/og/:symbol
 *
 * Returns a social-preview SVG image for the given ticker symbol.
 *
 * Path params: symbol — ticker, e.g. AAPL, BTC-USD
 * Query params:
 *  name      — company/asset name subtitle (optional)
 *  direction — BUY | SELL | HOLD | NEUTRAL (optional)
 *  price     — last price as a number string (optional)
 *  change    — percent change as a number string (optional)
 *
 * The response is image/svg+xml with a 1-hour Cache-Control header.
 * Social crawlers that require PNG should use a client-side screenshot tool;
 * modern crawlers (Twitter, LinkedIn) render inline SVG correctly.
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const DEFAULT_ACCENT = "#00d4aa";

function dirColor(direction: string): string {
  const d = direction.toUpperCase();
  if (d === "BUY" || d === "STRONG_BUY") return "#22c55e";
  if (d === "SELL" || d === "STRONG_SELL") return "#ef4444";
  return "#f59e0b";
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSvg(opts: {
  ticker: string;
  name: string;
  price: string;
  change: string;
  direction: string;
  accent: string;
}): string {
  const { ticker, name, price, change, direction, accent } = opts;
  const badge = direction ? dirColor(direction) : accent;
  const changeSign = parseFloat(change) >= 0 ? "+" : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  <!-- Accent bar -->
  <rect x="0" y="0" width="8" height="${OG_HEIGHT}" fill="${escXml(accent)}"/>
  <!-- Brand -->
  <text x="60" y="80" font-family="system-ui,sans-serif" font-size="28" font-weight="600" fill="${escXml(accent)}" opacity="0.9">CrossTide</text>
  <!-- Ticker -->
  <text x="60" y="240" font-family="system-ui,sans-serif" font-size="120" font-weight="800" fill="#f8fafc" letter-spacing="-2">${escXml(ticker)}</text>
  <!-- Company name -->
  ${name ? `<text x="60" y="300" font-family="system-ui,sans-serif" font-size="32" fill="#94a3b8">${escXml(name)}</text>` : ""}
  <!-- Price -->
  ${price ? `<text x="60" y="420" font-family="system-ui,sans-serif" font-size="64" font-weight="700" fill="#f8fafc">$${escXml(price)}</text>` : ""}
  <!-- Change -->
  ${change ? `<text x="${price ? "60" : "60"}" y="490" font-family="system-ui,sans-serif" font-size="36" fill="${parseFloat(change) >= 0 ? "#22c55e" : "#ef4444"}">${changeSign}${escXml(change)}%</text>` : ""}
  <!-- Consensus badge -->
  ${
    direction
      ? `
  <rect x="60" y="530" width="160" height="56" rx="8" fill="${escXml(badge)}" opacity="0.2"/>
  <rect x="60" y="530" width="160" height="56" rx="8" fill="none" stroke="${escXml(badge)}" stroke-width="2"/>
  <text x="140" y="566" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" font-weight="700" fill="${escXml(badge)}">${escXml(direction.toUpperCase())}</text>
  `
      : ""
  }
  <!-- Watermark -->
  <text x="${OG_WIDTH - 40}" y="${OG_HEIGHT - 30}" text-anchor="end" font-family="system-ui,sans-serif" font-size="22" fill="#334155">crosstide.pages.dev</text>
</svg>`;
}

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;

export function handleOgImage(url: URL): Response {
  // Extract symbol from path: /api/og/AAPL or /api/og/AAPL.svg
  const pathParts = url.pathname.split("/");
  const rawSymbol = (pathParts[pathParts.length - 1] ?? "").replace(/\.svg$/i, "");
  const ticker = rawSymbol.toUpperCase();

  if (!ticker || !TICKER_RE.test(ticker)) {
    return new Response("Invalid symbol", { status: 400 });
  }

  const name = url.searchParams.get("name") ?? "";
  const direction = url.searchParams.get("direction") ?? "";
  const price = url.searchParams.get("price") ?? "";
  const change = url.searchParams.get("change") ?? "";

  const svg = buildSvg({ ticker, name, price, change, direction, accent: DEFAULT_ACCENT });

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
