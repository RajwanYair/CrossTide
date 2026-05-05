#!/usr/bin/env node
/**
 * OpenAPI → TypeScript client type codegen (P16).
 *
 * Reads OPENAPI_SPEC from worker/routes/openapi.ts and generates typed
 * request/response interfaces into src/core/api-types.ts.
 *
 * Usage:
 *   npm run gen:api-types
 *
 * The generated file is committed; re-run whenever the OpenAPI spec changes.
 * Requires Node.js 22+ (--experimental-strip-types).
 */

// @ts-check
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const outFile = resolve(rootDir, "src", "core", "api-types.ts");

// Import spec directly — works when run via:
//   node --experimental-strip-types scripts/gen-openapi-client.mjs
// We use a child process so type-stripping applies to the TypeScript import.
let spec;
try {
  const { execSync } = await import("node:child_process");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const tmpScript = join(tmpdir(), "_ct_spec_extractor.mjs");
  // Use file:// URL for Windows path compatibility with ESM import()
  const specUrl = pathToFileURL(resolve(rootDir, "worker", "routes", "openapi.ts")).href;
  writeFileSync(
    tmpScript,
    `import { OPENAPI_SPEC } from '${specUrl}'; process.stdout.write(JSON.stringify(OPENAPI_SPEC));`,
    "utf-8",
  );
  const raw = execSync(`node --experimental-strip-types "${tmpScript}"`, { encoding: "utf-8" });
  spec = JSON.parse(raw);
} catch (err) {
  console.error(
    "Could not load OPENAPI_SPEC.\n" +
      "Requires Node >= 22. Error: " +
      String(err instanceof Error ? err.message : err),
  );
  process.exit(1);
}

/**
 * @param {unknown} schema
 * @param {Record<string, unknown>} schemas
 * @param {number} depth
 * @returns {string}
 */
function schemaToTs(schema, schemas, depth = 0) {
  if (!schema || typeof schema !== "object") return "unknown";
  const s = /** @type {Record<string, unknown>} */ (schema);
  const indent = "  ".repeat(depth);
  const innerIndent = "  ".repeat(depth + 1);

  if (typeof s["$ref"] === "string") {
    return s["$ref"].replace("#/components/schemas/", "");
  }

  if (Array.isArray(s["enum"])) {
    return s["enum"].map((v) => JSON.stringify(v)).join(" | ");
  }

  if (s["type"] === "string") return "string";
  if (s["type"] === "number" || s["type"] === "integer") return "number";
  if (s["type"] === "boolean") return "boolean";

  if (s["type"] === "array") {
    const itemType = schemaToTs(s["items"], schemas, depth);
    return `${itemType}[]`;
  }

  if (s["type"] === "object" || s["properties"]) {
    const props = /** @type {Record<string, unknown>} */ (s["properties"] ?? {});
    const required = new Set(Array.isArray(s["required"]) ? s["required"] : []);
    const lines = Object.entries(props).map(([name, propSchema]) => {
      const opt = required.has(name) ? "" : "?";
      const tsType = schemaToTs(propSchema, schemas, depth + 1);
      return `${innerIndent}readonly ${name}${opt}: ${tsType};`;
    });
    return lines.length > 0 ? `{\n${lines.join("\n")}\n${indent}}` : "Record<string, unknown>";
  }

  return "unknown";
}

/**
 * @param {string} name
 * @param {unknown} schema
 * @param {Record<string, unknown>} schemas
 * @returns {string}
 */
function generateInterface(name, schema, schemas) {
  const body = schemaToTs(schema, schemas, 1);
  return body.startsWith("{")
    ? `export interface ${name} ${body}`
    : `export type ${name} = ${body};`;
}

// ── Code generation ──────────────────────────────────────────────────────────

const schemas = /** @type {Record<string, unknown>} */ (spec.components?.schemas ?? {});
const paths = /** @type {Record<string, Record<string, unknown>>} */ (spec.paths ?? {});

const schemaInterfaces = Object.entries(schemas)
  .map(([name, schema]) => generateInterface(name, schema, schemas))
  .join("\n\n");

// Generate ApiRoutes interface mapping operationId → { request, response }
const routeLines = [];
for (const [path, methods] of Object.entries(paths)) {
  for (const [method, op] of Object.entries(
    /** @type {Record<string, Record<string, unknown>>} */ (methods),
  )) {
    const operationId = op["operationId"];
    if (typeof operationId !== "string") continue;
    const ok200 = /** @type {Record<string, unknown>} */ (
      /** @type {Record<string, unknown>} */ (op["responses"] ?? {})["200"] ?? {}
    );
    const jsonContent = /** @type {Record<string, unknown>} */ (
      /** @type {Record<string, unknown>} */ (ok200["content"] ?? {})["application/json"] ?? {}
    );
    const responseType = schemaToTs(jsonContent["schema"], schemas, 0);

    const bodyContent = /** @type {Record<string, unknown>} */ (
      /** @type {Record<string, unknown>} */ (
        /** @type {Record<string, unknown>} */ (op["requestBody"] ?? {})["content"] ?? {}
      )["application/json"] ?? {}
    );
    const requestType = bodyContent["schema"]
      ? schemaToTs(bodyContent["schema"], schemas, 0)
      : "never";

    routeLines.push(`  /** ${method.toUpperCase()} ${path} */`);
    routeLines.push(`  readonly ${operationId}: {`);
    routeLines.push(`    readonly request: ${requestType};`);
    routeLines.push(`    readonly response: ${responseType};`);
    routeLines.push(`  };`);
  }
}
const apiRoutes = `export interface ApiRoutes {\n${routeLines.join("\n")}\n}`;

const banner = `/**
 * CrossTide Worker API — generated TypeScript client types (P16).
 * DO NOT EDIT — regenerate with: npm run gen:api-types
 *
 * Source: worker/routes/openapi.ts (OpenAPI ${spec.openapi})
 * Generated: ${new Date().toISOString().split("T")[0]}
 */

`;

writeFileSync(outFile, banner + schemaInterfaces + "\n\n" + apiRoutes + "\n", "utf-8");
console.log(`Generated ${outFile}`);
console.log(`  ${Object.keys(schemas).length} schema interfaces`);
console.log(`  ${Object.values(paths).flatMap((m) => Object.values(m)).length} route operations`);
