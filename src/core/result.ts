/**
 * Result<T, E> — discriminated union for fallible operations. Companion
 * helpers: `ok`, `err`, `isOk`, `isErr`, `map`, `mapErr`, `andThen`,
 * `unwrap`, `unwrapOr`, `tryCatch`, `tryCatchAsync`.
 */

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

export const map = <T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  r.ok ? ok(fn(r.value)) : r;

export const mapErr = <T, E, F>(r: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
  r.ok ? r : err(fn(r.error));

export const andThen = <T, U, E>(r: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> =>
  r.ok ? fn(r.value) : r;

export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw r.error instanceof Error ? r.error : new Error(String(r.error));
};

export const unwrapOr = <T, E>(r: Result<T, E>, fallback: T): T => (r.ok ? r.value : fallback);

export function tryCatch<T>(fn: () => T): Result<T, unknown> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e);
  }
}

export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e);
  }
}
