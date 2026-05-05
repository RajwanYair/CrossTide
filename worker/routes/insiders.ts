/**
 * /api/insiders/:symbol — Insider trading activity endpoint.
 *
 * Returns recent insider transactions (buys, sells, exercises)
 * from Yahoo Finance's insiderHolders/insiderTransactions data.
 * Caches in KV with 6-hour TTL.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const INSIDERS_TTL = 21600; // 6 hours

interface InsiderTx {
  readonly name: string;
  readonly title: string;
  readonly date: string;
  readonly type: string;
  readonly shares: number;
  readonly value: number;
}

interface InsidersResponse {
  readonly symbol: string;
  readonly transactions: readonly InsiderTx[];
  readonly count: number;
  readonly source: string;
}

export async function handleInsiders(symbol: string, env: Env): Promise<Response> {
  const sym = symbol.toUpperCase();

  if (!/^[A-Z0-9.^=-]{1,20}$/.test(sym)) {
    return Response.json({ error: "Invalid symbol" }, { status: 400 });
  }

  const cacheKey = `insiders:${sym}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<InsidersResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=insiderTransactions`;

    const res = await fetch(url, {
      headers: { "User-Agent": "CrossTide/1.0" },
    });

    if (!res.ok) {
      return Response.json({ error: "Upstream provider error" }, { status: 502 });
    }

    const json = (await res.json()) as {
      quoteSummary?: {
        result?: Array<{
          insiderTransactions?: {
            transactions?: Array<{
              filerName?: { raw?: string };
              filerRelation?: { raw?: string };
              transactionText?: string;
              startDate?: { fmt?: string };
              shares?: { raw?: number };
              value?: { raw?: number };
            }>;
          };
        }>;
      };
    };

    const rawTxs = json.quoteSummary?.result?.[0]?.insiderTransactions?.transactions ?? [];

    const transactions: InsiderTx[] = rawTxs
      .filter((t) => typeof t.filerName?.raw === "string" && typeof t.startDate?.fmt === "string")
      .map((t) => ({
        name: t.filerName?.raw ?? "Unknown",
        title: t.filerRelation?.raw ?? "Unknown",
        date: t.startDate?.fmt ?? "",
        type: classifyTransaction(t.transactionText ?? ""),
        shares: t.shares?.raw ?? 0,
        value: t.value?.raw ?? 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const data: InsidersResponse = {
      symbol: sym,
      transactions,
      count: transactions.length,
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, INSIDERS_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch insider data" }, { status: 502 });
  }
}

function classifyTransaction(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("purchase") || lower.includes("buy")) return "buy";
  if (lower.includes("sale") || lower.includes("sell")) return "sell";
  if (lower.includes("exercise")) return "exercise";
  if (lower.includes("gift")) return "gift";
  return "other";
}
