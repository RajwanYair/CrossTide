/**
 * IndexedDB schema migration helper. Defines a list of schema versions
 * and a function to upgrade an IDBDatabase from one version to the next.
 *
 * Usage:
 *   const migrations: SchemaMigration[] = [
 *     { version: 1, upgrade: (db) => db.createObjectStore("kv") },
 *     { version: 2, upgrade: (db) => db.createObjectStore("cache") },
 *   ];
 *   const dbVersion = latestVersion(migrations);
 *   indexedDB.open("name", dbVersion).onupgradeneeded = (e) =>
 *     applyMigrations(e.target.result, e.oldVersion, migrations);
 */

export interface SchemaMigration {
  /** Target version after this migration runs. Must be 1+. */
  readonly version: number;
  /** Mutation applied to the database during onupgradeneeded. */
  readonly upgrade: (db: IDBDatabase, transaction: IDBTransaction | null) => void;
}

export function latestVersion(migrations: readonly SchemaMigration[]): number {
  if (migrations.length === 0) return 1;
  return migrations.reduce((max, m) => (m.version > max ? m.version : max), 0);
}

export function validateMigrations(migrations: readonly SchemaMigration[]): void {
  const seen = new Set<number>();
  let prev = 0;
  for (const m of migrations) {
    if (m.version < 1) {
      throw new Error(`Migration version must be >= 1 (got ${m.version})`);
    }
    if (seen.has(m.version)) {
      throw new Error(`Duplicate migration version ${m.version}`);
    }
    if (m.version <= prev) {
      throw new Error(`Migrations must be in ascending order; ${m.version} after ${prev}`);
    }
    seen.add(m.version);
    prev = m.version;
  }
}

/**
 * Run every migration with version > oldVersion against `db`.
 * Call this from your IDBOpenDBRequest's `onupgradeneeded` handler.
 */
export function applyMigrations(
  db: IDBDatabase,
  oldVersion: number,
  migrations: readonly SchemaMigration[],
  transaction: IDBTransaction | null = null,
): number {
  validateMigrations(migrations);
  let applied = 0;
  for (const m of migrations) {
    if (m.version > oldVersion) {
      m.upgrade(db, transaction);
      applied++;
    }
  }
  return applied;
}
