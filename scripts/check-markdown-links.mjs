/** Check local Markdown targets and anchors without network-dependent tooling. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IGNORED = new Set([
  ".git",
  "node_modules",
  "coverage",
  "dist",
  "test-results",
  "playwright-report",
]);
const LINK_PATTERN = /\]\(([^)\s]+)/gu;
const compareStrings = (left, right) => left.localeCompare(right);

function markdownFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(path));
    else if (extname(entry.name) === ".md") files.push(path);
  }
  return files.sort(compareStrings);
}

function slugify(heading) {
  let cleanHeading = heading.trim();
  while (cleanHeading.endsWith("#")) cleanHeading = cleanHeading.slice(0, -1).trimEnd();
  return cleanHeading
    .toLowerCase()
    .replace(/[`*_~]/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s/gu, "-");
}

function headings(source) {
  return new Set(
    source
      .split("\n")
      .map((line) => line.match(/^#{1,6} +(.+)$/u))
      .filter((match) => match !== null)
      .map((match) => slugify(match[1])),
  );
}

function checkTarget(sourceFile, target, documents) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(target)) return undefined;
  const [pathPart, fragment] = target.split("#", 2);
  const normalizedPath = decodeURIComponent(pathPart ?? "");
  const targetDirectory = normalizedPath.startsWith("/") ? ROOT : dirname(sourceFile);
  const targetFile = normalizedPath ? resolve(targetDirectory, normalizedPath) : sourceFile;
  if (!existsSync(targetFile) && !documents.has(targetFile)) {
    return `missing target ${target}`;
  }
  const targetSource = documents.get(targetFile) ?? readFileSync(targetFile, "utf8");
  if (fragment && !headings(targetSource).has(fragment.toLowerCase())) {
    return `missing anchor ${target}`;
  }
  return undefined;
}

/** Return local Markdown link errors for a source document. */
export function checkDocumentLinks(source, sourceFile, documents) {
  const errors = [];
  for (const match of source.matchAll(LINK_PATTERN)) {
    const target = match[1];
    const error = checkTarget(sourceFile, target, documents);
    if (error) errors.push(`${relative(ROOT, sourceFile)}: ${error}`);
  }
  return errors;
}

/** Check all repository Markdown files for broken local targets and anchors. */
export function checkMarkdownLinks(root = ROOT) {
  const files = markdownFiles(root);
  const documents = new Map(files.map((file) => [file, readFileSync(file, "utf8")]));
  return files.flatMap((file) => checkDocumentLinks(readFileSync(file, "utf8"), file, documents));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkMarkdownLinks();
  if (errors.length > 0) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("Markdown local links are valid.\n");
  }
}
