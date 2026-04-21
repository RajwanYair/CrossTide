/**
 * IndexedDB async key-value wrapper.
 *
 * Provides a thin typed interface over IndexedDB for large-data persistence
 * (candle history, alert records, etc.).
 */

const DB_NAME = "crosstide-db";
const DB_VERSION = 1;
const DEFAULT_STORE = "kv";

export interface IDB {
  get<T>(key: string, storeName?: string): Promise<T | null>;
  set<T>(key: string, value: T, storeName?: string): Promise<void>;
  delete(key: string, storeName?: string): Promise<void>;
  clear(storeName?: string): Promise<void>;
  keys(storeName?: string): Promise<string[]>;
  close(): void;
}

export function openIDB(
  dbName: string = DB_NAME,
  storeNames: readonly string[] = [DEFAULT_STORE],
  version: number = DB_VERSION,
): Promise<IDB> {
  return new Promise<IDB>((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of storeNames) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      const api: IDB = {
        get<T>(key: string, storeName = DEFAULT_STORE): Promise<T | null> {
          return new Promise((res, rej) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => res((req.result as T) ?? null);
            req.onerror = () => rej(req.error);
          });
        },

        set<T>(key: string, value: T, storeName = DEFAULT_STORE): Promise<void> {
          return new Promise((res, rej) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.put(value, key);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
          });
        },

        delete(key: string, storeName = DEFAULT_STORE): Promise<void> {
          return new Promise((res, rej) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
          });
        },

        clear(storeName = DEFAULT_STORE): Promise<void> {
          return new Promise((res, rej) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
          });
        },

        keys(storeName = DEFAULT_STORE): Promise<string[]> {
          return new Promise((res, rej) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.getAllKeys();
            req.onsuccess = () => res(req.result as string[]);
            req.onerror = () => rej(req.error);
          });
        },

        close(): void {
          db.close();
        },
      };

      resolve(api);
    };

    request.onerror = () => reject(request.error);
  });
}
