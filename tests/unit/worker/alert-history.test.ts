/**
 * Alert History route tests.
 */
import { describe, it, expect, vi } from "vitest";
import {
  insertAlertHistory,
  queryAlertHistory,
  handleAlertHistory,
} from "../../../worker/routes/alert-history";

function createMockDb(rows: unknown[] = []) {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: rows, success: true, meta: {} }),
    run: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    first: vi.fn().mockResolvedValue(null),
  };
  return {
    prepare: vi.fn().mockReturnValue(stmt),
    batch: vi.fn().mockResolvedValue([]),
    exec: vi.fn().mockResolvedValue({ count: 0, duration: 0 }),
    _stmt: stmt,
  };
}

describe("alert-history route", () => {
  describe("insertAlertHistory", () => {
    it("inserts with correct bindings", async () => {
      const db = createMockDb();
      await insertAlertHistory(db, {
        ruleId: "r1",
        userId: "u1",
        ticker: "AAPL",
        condition: '{"field":"price","operator":"above","value":200}',
        value: 205.5,
        firedAt: "2025-01-15T10:30:00Z",
      });

      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO alert_history"));
      expect(db._stmt.bind).toHaveBeenCalledWith(
        "r1",
        "u1",
        "AAPL",
        '{"field":"price","operator":"above","value":200}',
        205.5,
        "2025-01-15T10:30:00Z",
      );
      expect(db._stmt.run).toHaveBeenCalled();
    });
  });

  describe("queryAlertHistory", () => {
    it("queries with user_id filter", async () => {
      const rows = [
        {
          id: "h1",
          rule_id: "r1",
          user_id: "u1",
          ticker: "AAPL",
          condition: "{}",
          value: 200,
          fired_at: "2025-01-15T10:30:00Z",
        },
      ];
      const db = createMockDb(rows);
      const result = await queryAlertHistory(db, { userId: "u1" });

      expect(result.history).toEqual(rows);
      expect(result.count).toBe(1);
      expect(db._stmt.bind).toHaveBeenCalledWith("u1", 50);
    });

    it("applies ticker filter", async () => {
      const db = createMockDb([]);
      await queryAlertHistory(db, { userId: "u1", ticker: "msft" });

      expect(db._stmt.bind).toHaveBeenCalledWith("u1", "MSFT", 50);
    });

    it("applies since filter", async () => {
      const db = createMockDb([]);
      await queryAlertHistory(db, { userId: "u1", since: "2025-01-01T00:00:00Z" });

      expect(db._stmt.bind).toHaveBeenCalledWith("u1", "2025-01-01T00:00:00Z", 50);
    });

    it("clamps limit between 1 and 200", async () => {
      const db = createMockDb([]);
      await queryAlertHistory(db, { userId: "u1", limit: 999 });
      expect(db._stmt.bind).toHaveBeenCalledWith("u1", 200);

      await queryAlertHistory(db, { userId: "u1", limit: 0 });
      expect(db._stmt.bind).toHaveBeenCalledWith("u1", 1);
    });
  });

  describe("handleAlertHistory", () => {
    it("returns 503 when DB is unavailable", async () => {
      const url = new URL("http://localhost/api/alerts/history?user_id=u1");
      const res = await handleAlertHistory(url, {});
      expect(res.status).toBe(503);
    });

    it("returns 400 when user_id is missing", async () => {
      const db = createMockDb();
      const url = new URL("http://localhost/api/alerts/history");
      const res = await handleAlertHistory(url, { DB: db });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("user_id");
    });

    it("returns history for valid request", async () => {
      const rows = [
        {
          id: "h1",
          rule_id: "r1",
          user_id: "u1",
          ticker: "AAPL",
          condition: "{}",
          value: 200,
          fired_at: "2025-01-15T10:30:00Z",
        },
      ];
      const db = createMockDb(rows);
      const url = new URL("http://localhost/api/alerts/history?user_id=u1&ticker=AAPL&limit=10");
      const res = await handleAlertHistory(url, { DB: db });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { history: unknown[]; count: number };
      expect(body.history).toEqual(rows);
      expect(body.count).toBe(1);
    });
  });
});
