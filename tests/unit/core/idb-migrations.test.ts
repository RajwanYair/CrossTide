import { describe, it, expect, vi } from "vitest";
import {
  latestVersion,
  validateMigrations,
  applyMigrations,
  type SchemaMigration,
} from "../../../src/core/idb-migrations";

const fakeDb = (): IDBDatabase => ({}) as unknown as IDBDatabase;

describe("idb-migrations", () => {
  it("latestVersion returns max version", () => {
    const m: SchemaMigration[] = [
      { version: 1, upgrade: () => undefined },
      { version: 2, upgrade: () => undefined },
      { version: 5, upgrade: () => undefined },
    ];
    expect(latestVersion(m)).toBe(5);
  });

  it("latestVersion returns 1 for empty list", () => {
    expect(latestVersion([])).toBe(1);
  });

  it("validateMigrations rejects version 0", () => {
    expect(() => validateMigrations([{ version: 0, upgrade: () => undefined }])).toThrow();
  });

  it("validateMigrations rejects duplicate versions", () => {
    expect(() =>
      validateMigrations([
        { version: 1, upgrade: () => undefined },
        { version: 1, upgrade: () => undefined },
      ]),
    ).toThrow();
  });

  it("validateMigrations rejects out-of-order versions", () => {
    expect(() =>
      validateMigrations([
        { version: 2, upgrade: () => undefined },
        { version: 1, upgrade: () => undefined },
      ]),
    ).toThrow();
  });

  it("applyMigrations runs only versions above oldVersion", () => {
    const m1 = vi.fn();
    const m2 = vi.fn();
    const m3 = vi.fn();
    const migs: SchemaMigration[] = [
      { version: 1, upgrade: m1 },
      { version: 2, upgrade: m2 },
      { version: 3, upgrade: m3 },
    ];
    const applied = applyMigrations(fakeDb(), 1, migs);
    expect(applied).toBe(2);
    expect(m1).not.toHaveBeenCalled();
    expect(m2).toHaveBeenCalled();
    expect(m3).toHaveBeenCalled();
  });

  it("applyMigrations runs all when oldVersion is 0", () => {
    const m1 = vi.fn();
    const m2 = vi.fn();
    expect(
      applyMigrations(fakeDb(), 0, [
        { version: 1, upgrade: m1 },
        { version: 2, upgrade: m2 },
      ]),
    ).toBe(2);
  });

  it("applyMigrations passes transaction through", () => {
    const tx = { fake: true } as unknown as IDBTransaction;
    let received: IDBTransaction | null = null;
    applyMigrations(
      fakeDb(),
      0,
      [
        {
          version: 1,
          upgrade: (_db, t) => {
            received = t;
          },
        },
      ],
      tx,
    );
    expect(received).toBe(tx);
  });
});
