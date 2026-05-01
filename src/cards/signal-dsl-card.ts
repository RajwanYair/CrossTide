/**
 * Signal DSL Card (D4) — interactive expression evaluator for signal rules.
 *
 * Users type a DSL expression (e.g. `rsi < 30 and price > 50`), supply
 * variable values, then click "Evaluate" to see the computed result.
 *
 * The card is intentionally minimal: it shows the input panel, an optional
 * variables editor (JSON-formatted key:value pairs), and the result badge.
 *
 * Built-in functions available in every evaluation:
 *   abs(x), min(a,b), max(a,b), round(x), floor(x), ceil(x)
 */
import type { CardHandle, CardContext } from "./registry";
import { compileSignal } from "../domain/signal-dsl";
import type { EvalContext, Value } from "../domain/signal-dsl";

/** Shared built-in functions exposed to every expression. */
const BUILTIN_FUNCS: Readonly<Record<string, (...args: Value[]) => Value>> = {
  abs: (x) => Math.abs(Number(x)),
  min: (a, b) => Math.min(Number(a), Number(b)),
  max: (a, b) => Math.max(Number(a), Number(b)),
  round: (x) => Math.round(Number(x)),
  floor: (x) => Math.floor(Number(x)),
  ceil: (x) => Math.ceil(Number(x)),
};

function renderResult(value: Value): string {
  if (typeof value === "boolean") {
    return value
      ? `<span class="signal-buy dsl-result-badge">✓ true</span>`
      : `<span class="signal-sell dsl-result-badge">✗ false</span>`;
  }
  return `<span class="dsl-result-badge">${value}</span>`;
}

function parseVars(raw: string): Record<string, number> | null {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v !== "number") return null;
      out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

export function mount(container: HTMLElement, _ctx: CardContext): CardHandle {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Signal DSL</h2>
      </div>
      <div class="dsl-card-body">
        <p class="text-secondary dsl-hint">
          Enter a signal expression. Use variables like <code>rsi</code>, <code>price</code>,
          <code>volume</code> and define their values below.
          Built-in functions: <code>abs</code>, <code>min</code>, <code>max</code>,
          <code>round</code>, <code>floor</code>, <code>ceil</code>.
        </p>

        <label for="dsl-expr-input" class="dsl-label">Expression</label>
        <textarea
          id="dsl-expr-input"
          class="dsl-expr-input"
          rows="3"
          placeholder="e.g. rsi < 30 and price > 50"
          spellcheck="false"
          aria-label="DSL expression"
        ></textarea>

        <label for="dsl-vars-input" class="dsl-label">Variables (JSON)</label>
        <textarea
          id="dsl-vars-input"
          class="dsl-vars-input"
          rows="3"
          placeholder='{"rsi": 28, "price": 155.4}'
          spellcheck="false"
          aria-label="Variable values as JSON"
        ></textarea>

        <div class="dsl-actions">
          <button id="dsl-eval-btn" class="btn-primary" type="button">Evaluate</button>
          <button id="dsl-clear-btn" class="btn-secondary" type="button">Clear</button>
        </div>

        <div id="dsl-result-area" class="dsl-result-area" aria-live="polite" aria-atomic="true"></div>

        <details class="dsl-examples">
          <summary>Example expressions</summary>
          <ul>
            <li><code>rsi &lt; 30 and price &gt; 50</code> — oversold check</li>
            <li><code>volume &gt; 1000000 and close &gt; open</code> — breakout</li>
            <li><code>abs(change) &gt; 5</code> — large move</li>
            <li><code>max(high, prev_high) - min(low, prev_low) &gt; 10</code> — range expansion</li>
          </ul>
        </details>
      </div>
    </div>
  `;

  const exprInput = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
  const varsInput = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
  const evalBtn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
  const clearBtn = container.querySelector<HTMLButtonElement>("#dsl-clear-btn")!;
  const resultArea = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

  function evaluate(): void {
    const expr = exprInput.value.trim();
    if (!expr) {
      resultArea.innerHTML = `<span class="text-secondary">Enter an expression above.</span>`;
      return;
    }

    const rawVars = varsInput.value.trim();
    const vars = parseVars(rawVars);
    if (vars === null) {
      resultArea.innerHTML = `<span class="signal-sell">Variables must be a JSON object with numeric values, e.g. {"rsi": 28}</span>`;
      return;
    }

    try {
      const compiled = compileSignal(expr);
      const ctx: EvalContext = { vars, funcs: BUILTIN_FUNCS };
      const result = compiled(ctx);
      resultArea.innerHTML = `<span class="text-secondary">Result: </span>${renderResult(result)}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      resultArea.innerHTML = `<span class="signal-sell">Error: ${escapeHtml(msg)}</span>`;
    }
  }

  evalBtn.addEventListener("click", evaluate);

  exprInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      evaluate();
    }
  });

  clearBtn.addEventListener("click", () => {
    exprInput.value = "";
    varsInput.value = "";
    resultArea.innerHTML = "";
  });

  return {
    dispose() {
      // Event listeners are GC'd with the DOM nodes.
    },
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default { mount };
