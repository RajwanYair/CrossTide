/**
 * Tests for migration status endpoint.
 */
import { describe, it, expect } from "vitest";
import { handleMigrationStatus } from "../../../worker/routes/migrations";

describe("handleMigrationStatus", () => {
  it("returns 503 when DB is not available", async () => {
    const res = await handleMigrationStatus({});
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("Database not available");
  });

  it("returns status when d1_migrations table does not exist", async () => {
    const env = {
      DB: {
        prepare: () => ({
          first: async () => null,
          all: async () => ({ results: [], success: true, meta: {} }),
          run: async () => ({ results: [], success: true, meta: {} }),
          bind: () => ({
            first: async () => null,
            all: async () => ({ results: [] }),
            run: async () => ({}),
          }),
        }),
        batch: async () => [],
        exec: async () => ({ count: 0, duration: 0 }),
      },
    };

    const res = await handleMigrationStatus(env as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(2);
    expect(body.applied).toBe(0);
    expect(body.pending).toBe(2);
    expect(body.isUpToDate).toBe(false);
    expect(body.migrations).toHaveLength(2);
    expect(body.migrations[0].id).toBe("0001");
    expect(body.migrations[0].applied).toBe(false);
  });

  it("returns up-to-date status when all migrations applied", async () => {
    const env = {
      DB: {
        prepare: (sql: string) => {
          if (sql.includes("sqlite_master")) {
            return { first: async () => ({ name: "d1_migrations" }), bind: () => ({}) };
          }
          return {
            first: async () => null,
            all: async () => ({
              results: [
                { id: 1, name: "0001_initial_schema", applied_at: "2025-01-01T00:00:00Z" },
                { id: 2, name: "0002_alert_history", applied_at: "2025-02-01T00:00:00Z" },
              ],
              success: true,
              meta: {},
            }),
            bind: () => ({}),
          };
        },
        batch: async () => [],
        exec: async () => ({ count: 0, duration: 0 }),
      },
    };

    const res = await handleMigrationStatus(env as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(2);
    expect(body.applied).toBe(2);
    expect(body.pending).toBe(0);
    expect(body.isUpToDate).toBe(true);
  });

  it("handles DB query errors gracefully", async () => {
    const env = {
      DB: {
        prepare: () => ({
          first: async () => {
            throw new Error("DB error");
          },
          all: async () => {
            throw new Error("DB error");
          },
          bind: () => ({}),
        }),
        batch: async () => [],
        exec: async () => ({ count: 0, duration: 0 }),
      },
    };

    const res = await handleMigrationStatus(env as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Failed to query migration status");
  });
});
