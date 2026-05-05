---
mode: agent
description: Export a domain module from the src/domain/index.ts barrel. Audits unexported functions and wires them.
tools:
  - grep_search
  - read_file
  - replace_string_in_file
  - runTests
  - get_errors
---

# Export Domain Function to Barrel

Export the function(s) specified by the user from `src/domain/index.ts`.

## Steps

1. **Audit current exports**

   ```
   grep_search("export \{" in src/domain/index.ts)
   ```

   Read `src/domain/index.ts` to see what is already exported.

2. **Find the function in its source file**
   - If the user didn't specify the file, search: `grep_search("export function ${functionName}" in src/domain/)`
   - Read the source file to confirm the exact exported name and signature.

3. **Add the export to `src/domain/index.ts`**
   - Group with related exports (indicators together, analytics together)
   - Format: `export { computeFoo } from "./indicators/foo";`
   - Never use `export *` — explicit named exports only

4. **Verify no circular imports**

   ```
   get_errors(["src/domain/index.ts"])
   ```

5. **Run domain tests to confirm nothing broke**
   ```
   runTests(files: ["tests/unit/domain/"])
   ```

## Rules

- Only export from `src/domain/index.ts` — never re-export through `src/core/` or `src/cards/`
- If the function doesn't exist yet, use the `add-indicator` prompt instead
- If the function is private/internal helper, do NOT export it — only export public API
- Export from the narrowest path: `"./indicators/foo"` not `"./indicators/index"`

## Common Barrel Audit

To find ALL unexported domain functions:

```bash
# Functions defined but not in the barrel:
grep -rn "^export function" src/domain/ --include="*.ts" | grep -v "index.ts" | sed 's/.*export function //' | sed 's/(.*//' | sort > /tmp/defined.txt
grep -n "export {" src/domain/index.ts | sed 's/.*{ //' | sed 's/ }.*//' | tr ',' '\n' | tr -d ' ' | sort > /tmp/exported.txt
comm -23 /tmp/defined.txt /tmp/exported.txt
```
