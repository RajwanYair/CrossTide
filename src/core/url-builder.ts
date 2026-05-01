/**
 * URL builder — fluent, immutable. Composes a base URL with path segments
 * and typed query parameters. Skips `undefined`; serializes arrays as
 * repeated keys; encodes safely via `URLSearchParams`.
 */

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number | boolean)[];

export interface UrlBuilder {
  path(segment: string): UrlBuilder;
  query(key: string, value: QueryValue): UrlBuilder;
  queryAll(params: Readonly<Record<string, QueryValue>>): UrlBuilder;
  hash(fragment: string | undefined): UrlBuilder;
  toString(): string;
  toURL(): URL;
}

const trimSlashes = (s: string): string => s.replace(/^\/+|\/+$/g, "");

export function urlBuilder(base: string): UrlBuilder {
  // Validate base immediately so misuse fails fast.
  void new URL(base);
  return make(base, [], [], undefined);
}

function make(
  base: string,
  segments: readonly string[],
  pairs: ReadonlyArray<readonly [string, string]>,
  hashFrag: string | undefined,
): UrlBuilder {
  return {
    path(segment): UrlBuilder {
      const cleaned = trimSlashes(segment);
      if (cleaned === "") return make(base, segments, pairs, hashFrag);
      return make(base, [...segments, cleaned], pairs, hashFrag);
    },
    query(key, value): UrlBuilder {
      if (value === undefined) return make(base, segments, pairs, hashFrag);
      const next: Array<readonly [string, string]> = [...pairs];
      if (value === null) next.push([key, ""]);
      else if (Array.isArray(value)) {
        for (const v of value) next.push([key, String(v)]);
      } else {
        next.push([key, String(value)]);
      }
      return make(base, segments, next, hashFrag);
    },
    queryAll(params): UrlBuilder {
      let b: UrlBuilder = make(base, segments, pairs, hashFrag);
      for (const k of Object.keys(params)) b = b.query(k, params[k]);
      return b;
    },
    hash(fragment): UrlBuilder {
      return make(base, segments, pairs, fragment);
    },
    toURL(): URL {
      const url = new URL(base);
      if (segments.length > 0) {
        const basePath = trimSlashes(url.pathname);
        const joined = [basePath, ...segments].filter((p) => p.length > 0).join("/");
        url.pathname = "/" + joined;
      }
      const params = new URLSearchParams();
      for (const [k, v] of pairs) params.append(k, v);
      url.search = params.toString();
      url.hash = hashFrag === undefined ? "" : hashFrag.startsWith("#") ? hashFrag : "#" + hashFrag;
      return url;
    },
    toString(): string {
      return this.toURL().toString();
    },
  };
}
