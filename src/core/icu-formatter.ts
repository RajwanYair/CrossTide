/**
 * ICU-subset message formatter.
 *
 * Implements a focused subset of ICU MessageFormat syntax:
 *  - Simple variable interpolation:  "Hello, {name}!"
 *  - Plural selection:               "{count, plural, =0{No items} =1{One item} other{# items}}"
 *  - Gender/value select:            "{gender, select, male{He} female{She} other{They}}"
 *  - Nested placeholders in choices: "{count, plural, one{1 alert} other{# alerts}}"
 *
 * Type-safe message dictionary:
 *  - Define messages with `defineMessages<T extends MessageDict>(dict: T): T`
 *  - `formatMessage(dict, key, values)` is fully type-checked on keys
 *
 * No external dependencies — pure TypeScript string processing.
 *
 * @see https://unicode-org.github.io/icu/userguide/format_parse/messages/
 */

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type MessageValues = Record<string, string | number>;

/** A message dictionary maps string keys to ICU message templates. */
export type MessageDict = Record<string, string>;

// ──────────────────────────────────────────────────────────────
// Core parser
// ──────────────────────────────────────────────────────────────

/**
 * Format an ICU-subset message template with the given values.
 *
 * @param template - ICU message string
 * @param values   - Substitution values; missing keys are replaced with the key name
 * @param locale   - BCP 47 locale tag used for plural rules (defaults to 'en')
 */
export function format(
  template: string,
  values: MessageValues = {},
  locale = "en",
): string {
  return parseSegment(template, values, locale);
}

// ──────────────────────────────────────────────────────────────
// Internal parser
// ──────────────────────────────────────────────────────────────

/** Parse one level of ICU message; recursion handles nested blocks. */
function parseSegment(text: string, values: MessageValues, locale: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    if (text[i] === "{") {
      // Find the matching closing brace (accounting for nesting)
      const end = findMatchingBrace(text, i);
      if (end === -1) {
        // Unmatched brace — treat literally
        result += text[i];
        i++;
        continue;
      }

      const inner = text.slice(i + 1, end);
      result += evalBlock(inner, values, locale);
      i = end + 1;
    } else {
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Find the index of the closing `}` that matches the `{` at `start`.
 * Returns -1 if not found.
 */
function findMatchingBrace(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Evaluate the contents of a `{...}` block.
 * Forms:
 *   `varName`                   → simple substitution
 *   `varName, plural, cases`    → plural selection
 *   `varName, select, cases`    → value selection
 */
function evalBlock(inner: string, values: MessageValues, locale: string): string {
  // Split on first comma to detect the block type
  const commaIdx = inner.indexOf(",");
  if (commaIdx === -1) {
    // Simple variable
    const key = inner.trim();
    return key in values ? String(values[key]) : key;
  }

  const varName = inner.slice(0, commaIdx).trim();
  const rest = inner.slice(commaIdx + 1).trim();

  const typeComma = rest.indexOf(",");
  if (typeComma === -1) {
    // Malformed — return as-is
    return `{${inner}}`;
  }

  const blockType = rest.slice(0, typeComma).trim().toLowerCase();
  const casesPart = rest.slice(typeComma + 1).trim();

  const rawValue = varName in values ? values[varName] : undefined;

  if (blockType === "plural") {
    const numVal = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0);
    return selectPlural(casesPart, numVal, values, locale);
  }

  if (blockType === "select") {
    const strVal = rawValue !== undefined ? String(rawValue) : "other";
    return selectValue(casesPart, strVal, values, locale);
  }

  // Unknown block type — return literal
  return `{${inner}}`;
}

// ──────────────────────────────────────────────────────────────
// Plural selection
// ──────────────────────────────────────────────────────────────

/**
 * Select the appropriate plural form given the numeric value.
 *
 * Supported case keys:
 *   `=N`    — exact match for integer N
 *   `zero`  — CLDR plural category
 *   `one`   — CLDR plural category
 *   `two`   — CLDR plural category
 *   `few`   — CLDR plural category
 *   `many`  — CLDR plural category
 *   `other` — catch-all
 *
 * `#` inside a case pattern is replaced with the numeric value.
 */
function selectPlural(
  casesPart: string,
  value: number,
  values: MessageValues,
  locale: string,
): string {
  const cases = parseCases(casesPart);
  const category = getPluralCategory(value, locale);

  // Exact match first (`=0`, `=1`, etc.)
  const exactKey = `=${value}`;
  if (exactKey in cases) {
    const template = cases[exactKey]!;
    return parseSegment(template.replace(/#/g, String(value)), values, locale);
  }

  // Category match
  if (category in cases) {
    const template = cases[category]!;
    return parseSegment(template.replace(/#/g, String(value)), values, locale);
  }

  // Fallback to `other`
  if ("other" in cases) {
    const template = cases["other"];
    return parseSegment(template.replace(/#/g, String(value)), values, locale);
  }

  return String(value);
}

// ──────────────────────────────────────────────────────────────
// Value (select) selection
// ──────────────────────────────────────────────────────────────

function selectValue(
  casesPart: string,
  value: string,
  values: MessageValues,
  locale: string,
): string {
  const cases = parseCases(casesPart);

  if (value in cases) {
    return parseSegment(cases[value]!, values, locale);
  }
  if ("other" in cases) {
    return parseSegment(cases["other"], values, locale);
  }
  return value;
}

// ──────────────────────────────────────────────────────────────
// Case parser
// ──────────────────────────────────────────────────────────────

/** Parse `key1{template1} key2{template2} ...` into a Record. */
function parseCases(casesPart: string): Record<string, string> {
  const result: Record<string, string> = {};
  let i = 0;

  while (i < casesPart.length) {
    // Skip whitespace
    while (i < casesPart.length && /\s/.test(casesPart[i] ?? "")) i++;
    if (i >= casesPart.length) break;

    // Read key (up to `{`)
    const braceIdx = casesPart.indexOf("{", i);
    if (braceIdx === -1) break;

    const key = casesPart.slice(i, braceIdx).trim();
    const end = findMatchingBrace(casesPart, braceIdx);
    if (end === -1) break;

    result[key] = casesPart.slice(braceIdx + 1, end);
    i = end + 1;
  }

  return result;
}

// ──────────────────────────────────────────────────────────────
// Plural category (CLDR English rules + Intl.PluralRules fallback)
// ──────────────────────────────────────────────────────────────

/** Determine the CLDR plural category for a number. */
export function getPluralCategory(
  n: number,
  locale: string,
): "zero" | "one" | "two" | "few" | "many" | "other" {
  if (typeof Intl !== "undefined" && Intl.PluralRules) {
    try {
      const pr = new Intl.PluralRules(locale);
      return pr.select(n);
    } catch {
      /* fall through */
    }
  }
  // Minimal fallback for English
  return n === 1 ? "one" : "other";
}

// ──────────────────────────────────────────────────────────────
// Type-safe message dictionary helpers
// ──────────────────────────────────────────────────────────────

/**
 * Define a type-safe message dictionary.
 * The returned value is identical to the input — this function exists
 * solely to preserve the literal key types for `formatMessage`.
 */
export function defineMessages<T extends MessageDict>(dict: T): T {
  return dict;
}

/**
 * Format a message from a typed dictionary.
 * Key type is narrowed to the actual keys of the dictionary.
 */
export function formatMessage<T extends MessageDict>(
  dict: T,
  key: keyof T & string,
  values: MessageValues = {},
  locale = "en",
): string {
  const template = dict[key];
  if (template === undefined) return key;
  return format(template, values, locale);
}
