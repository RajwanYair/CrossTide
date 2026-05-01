/**
 * Portfolio holdings store — IDB-persisted user portfolio positions.
 *
 * Holdings are stored in IndexedDB via the core/idb wrapper.
 * The card reads from this store; the settings/import flow writes to it.
 * Falls back to demo data when the store is empty.
 */
import { openIDB, type IDB } from "../core/idb";
import type { Holding } from "../domain/portfolio-analytics";

const DB_NAME = "crosstide-portfolio";
const STORE_NAME = "holdings";

export interface PersistedHolding extends Holding {
  /** ISO timestamp when position was added. */
  readonly addedAt: string;
}

let dbInstance: IDB | null = null;

async function getDb(): Promise<IDB> {
  if (!dbInstance) {
    dbInstance = await openIDB(DB_NAME, [STORE_NAME]);
  }
  return dbInstance;
}

/** Load all persisted holdings from IDB. */
export async function loadHoldings(): Promise<readonly PersistedHolding[]> {
  try {
    const db = await getDb();
    const keys = await db.keys(STORE_NAME);
    const results: PersistedHolding[] = [];
    for (const key of keys) {
      const h = await db.get<PersistedHolding>(key, STORE_NAME);
      if (h) results.push(h);
    }
    return results;
  } catch {
    return [];
  }
}

/** Save a holding (upsert by ticker). */
export async function saveHolding(holding: PersistedHolding): Promise<void> {
  const db = await getDb();
  await db.set(holding.ticker, holding, STORE_NAME);
}

/** Remove a holding by ticker. */
export async function removeHolding(ticker: string): Promise<void> {
  const db = await getDb();
  await db.delete(ticker, STORE_NAME);
}

/** Replace all holdings (bulk import). */
export async function replaceAllHoldings(holdings: readonly PersistedHolding[]): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
  for (const h of holdings) {
    await db.set(h.ticker, h, STORE_NAME);
  }
}

/** Check if user has any persisted holdings. */
export async function hasHoldings(): Promise<boolean> {
  try {
    const db = await getDb();
    const keys = await db.keys(STORE_NAME);
    return keys.length > 0;
  } catch {
    return false;
  }
}
