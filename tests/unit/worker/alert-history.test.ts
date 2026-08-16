/**
 * Alert History route tests.
 */
import { describe, it, expect, vi } from "vitest";
import {
  insertAlertHistory,
  queryAlertHistory,
  handleAlertHistory,
  exportAlertHistoryForUser,
  deleteAlertHistoryForUser,
  purgeExpiredAlertHistory,
  handleAlertHistoryExport,
  handleAlertHistoryDelete,
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

  describe("exportAlertHistoryForUser", () => {
    it("queries without a row-count cap on user_id alone", async () => {
      const db = createMockDb([]);
      await exportAlertHistoryForUser(db, "u1");
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("SELECT"));
      expect(db._stmt.bind).toHaveBeenCalledWith("u1", 10_000);
    });
  });

  describe("deleteAlertHistoryForUser", () => {
    it("deletes rows for the user and returns the change count", async () => {
      const db = createMockDb();
      db._stmt.run.mockResolvedValueOnce({ results: [], success: true, meta: { changes: 3 } });
      const deleted = await deleteAlertHistoryForUser(db, "u1");
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM alert_history WHERE user_id"),
      );
      expect(db._stmt.bind).toHaveBeenCalledWith("u1");
      expect(deleted).toBe(3);
    });

    it("returns 0 when meta.changes is not a number", async () => {
      const db = createMockDb();
      const deleted = await deleteAlertHistoryForUser(db, "u1");
      expect(deleted).toBe(0);
    });
  });

  describe("purgeExpiredAlertHistory", () => {
    it("deletes rows older than the retention window and returns the change count", async () => {
      const db = createMockDb();
      db._stmt.run.mockResolvedValueOnce({ results: [], success: true, meta: { changes: 12 } });
      const deleted = await purgeExpiredAlertHistory(db);
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM alert_history WHERE fired_at"),
      );
      expect(deleted).toBe(12);
    });

    it("accepts a custom retention window", async () => {
      const db = createMockDb();
      await purgeExpiredAlertHistory(db, 30);
      expect(db._stmt.bind).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("handleAlertHistoryExport", () => {
    it("returns 503 when DB is unavailable", async () => {
      const url = new URL("http://localhost/api/alerts/history/export?user_id=u1");
      const res = await handleAlertHistoryExport(url, {});
      expect(res.status).toBe(503);
    });

    it("returns 400 when user_id is missing", async () => {
      const db = createMockDb();
      const url = new URL("http://localhost/api/alerts/history/export");
      const res = await handleAlertHistoryExport(url, { DB: db });
      expect(res.status).toBe(400);
    });

    it("returns JSON by default", async () => {
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
      const url = new URL("http://localhost/api/alerts/history/export?user_id=u1");
      const res = await handleAlertHistoryExport(url, { DB: db });
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("application/json");
      const body = (await res.json()) as { history: unknown[]; count: number };
      expect(body.count).toBe(1);
    });

    it("returns CSV with format=csv", async () => {
      const rows = [
        {
          id: "h1",
          rule_id: "r1",
          user_id: "u1",
          ticker: "AAPL",
          condition: "value,with,commas",
          value: 200,
          fired_at: "2025-01-15T10:30:00Z",
        },
      ];
      const db = createMockDb(rows);
      const url = new URL("http://localhost/api/alerts/history/export?user_id=u1&format=csv");
      const res = await handleAlertHistoryExport(url, { DB: db });
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      expect(res.headers.get("Content-Disposition")).toContain("alert-history-u1.csv");
      const text = await res.text();
      expect(text).toContain("id,rule_id,user_id,ticker,condition,value,fired_at");
      expect(text).toContain('"value,with,commas"');
    });
  });

  describe("handleAlertHistoryDelete", () => {
    it("returns 503 when DB is unavailable", async () => {
      const url = new URL("http://localhost/api/alerts/history?user_id=u1");
      const res = await handleAlertHistoryDelete(url, {});
      expect(res.status).toBe(503);
    });

    it("returns 400 when user_id is missing", async () => {
      const db = createMockDb();
      const url = new URL("http://localhost/api/alerts/history");
      const res = await handleAlertHistoryDelete(url, { DB: db });
      expect(res.status).toBe(400);
    });

    it("deletes and reports the count", async () => {
      const db = createMockDb();
      db._stmt.run.mockResolvedValueOnce({ results: [], success: true, meta: { changes: 5 } });
      const url = new URL("http://localhost/api/alerts/history?user_id=u1");
      const res = await handleAlertHistoryDelete(url, { DB: db });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { deleted: number };
      expect(body.deleted).toBe(5);
    });
  });
});
