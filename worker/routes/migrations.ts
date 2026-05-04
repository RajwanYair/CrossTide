/**
 * GET /api/migrations/status — D1 migration status endpoint.
 *
 * Returns the list of applied migrations and whether the DB is up-to-date.
 * Available migrations are tracked by file naming convention (####_name.sql).
 */
import type { Env } from "../index.js";

/** Known migrations in the codebase. */
const KNOWN_MIGRATIONS = [
  { id: "0001", name: "initial_schema" },
  { id: "0002", name: "alert_history" },
] as const;

export interface MigrationStatus {
  readonly available: number;
  readonly applied: number;
  readonly pending: number;
  readonly isUpToDate: boolean;
  readonly migrations: readonly MigrationEntry[];
}

export interface MigrationEntry {
  readonly id: string;
  readonly name: string;
  readonly applied: boolean;
  readonly appliedAt: string | null;
}

/**
 * D1 stores applied migrations in d1_migrations table (created by wrangler).
 * We query that to determine which migrations have been applied.
 */
export async function handleMigrationStatus(env: Env): Promise<Response> {
  if (!env.DB) {
    return Response.json({ error: "Database not available", migrations: [] }, { status: 503 });
  }

  try {
    // Check if the d1_migrations table exists
    const tableCheck = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='d1_migrations'",
    ).first<{ name: string }>();

    const appliedMap = new Map<string, string>();

    if (tableCheck) {
      const result = await env.DB.prepare(
        "SELECT id, name, applied_at FROM d1_migrations ORDER BY id",
      ).all<{ id: number; name: string; applied_at: string }>();

      for (const row of result.results) {
        // Migration names in d1_migrations follow the format "####_name"
        const idStr = String(row.id).padStart(4, "0");
        appliedMap.set(idStr, row.applied_at);
      }
    }

    const migrations: MigrationEntry[] = KNOWN_MIGRATIONS.map((m) => ({
      id: m.id,
      name: m.name,
      applied: appliedMap.has(m.id),
      appliedAt: appliedMap.get(m.id) ?? null,
    }));

    const applied = migrations.filter((m) => m.applied).length;
    const status: MigrationStatus = {
      available: KNOWN_MIGRATIONS.length,
      applied,
      pending: KNOWN_MIGRATIONS.length - applied,
      isUpToDate: applied === KNOWN_MIGRATIONS.length,
      migrations,
    };

    return Response.json(status);
  } catch {
    return Response.json({ error: "Failed to query migration status" }, { status: 500 });
  }
}
