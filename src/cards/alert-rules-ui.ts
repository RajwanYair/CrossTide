/**
 * Alert Rules UI — renders multi-condition alert rule builder (L3).
 *
 * Integrates into the alerts-card as a collapsible rules section.
 */
import type { AlertCondition, AlertOperator, MethodName } from "../types/domain";
import { patchDOM } from "../core/patch-dom";
import {
  loadAlertRules,
  addAlertRule,
  removeAlertRule,
  toggleAlertRule,
  resetFiredRule,
  loadFiredRuleIds,
} from "../core/alert-rules-store";
import { createDelegate, type DelegateHandle } from "../ui/delegate";

const METHODS: readonly MethodName[] = [
  "Micho",
  "RSI",
  "MACD",
  "Bollinger",
  "Stochastic",
  "OBV",
  "ADX",
  "CCI",
  "SAR",
  "WilliamsR",
  "MFI",
  "SuperTrend",
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRulesList(container: HTMLElement): void {
  const rules = loadAlertRules();
  const firedIds = loadFiredRuleIds();

  if (rules.length === 0) {
    patchDOM(container, `<p class="empty-state">No alert rules defined. Create one below.</p>`);
    return;
  }

  const rows = rules
    .map((r) => {
      const condStr = r.conditions
        .map((c) =>
          c.type === "consensus" ? `Consensus ${c.direction}` : `${c.method} ${c.direction}`,
        )
        .join(` <span class="text-secondary">${r.operator}</span> `);
      const fired = firedIds.has(r.id);
      return `<tr class="alert-rule-row${r.enabled ? "" : " rule-disabled"}">
        <td>
          <button class="btn-icon" data-action="toggle-rule" data-id="${r.id}" title="${r.enabled ? "Disable" : "Enable"}">
            ${r.enabled ? "✓" : "○"}
          </button>
        </td>
        <td class="font-mono">${escapeHtml(r.ticker)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${condStr}</td>
        <td>
          ${fired ? `<span class="badge badge-sell">Fired</span> <button class="btn-icon" data-action="reset-rule" data-id="${r.id}" title="Reset">↺</button>` : `<span class="badge badge-buy">Active</span>`}
        </td>
        <td>
          <button class="btn-icon btn-danger" data-action="delete-rule" data-id="${r.id}" title="Delete">✕</button>
        </td>
      </tr>`;
    })
    .join("");

  patchDOM(
    container,
    `<table class="alert-rules-table">
      <thead><tr><th></th><th>Ticker</th><th>Name</th><th>Conditions</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  );
}

function renderCreateForm(container: HTMLElement): void {
  const methodOptions = METHODS.map((m) => `<option value="${m}">${m}</option>`).join("");

  patchDOM(
    container,
    `<details class="rule-create-form" open>
      <summary>Create New Rule</summary>
      <div class="rule-form-grid">
        <label>Rule Name
          <input id="rule-name" type="text" placeholder="e.g. Double Buy Signal" />
        </label>
        <label>Ticker
          <input id="rule-ticker" type="text" placeholder="AAPL" maxlength="10" />
        </label>
        <label>Operator
          <select id="rule-operator">
            <option value="AND">ALL conditions (AND)</option>
            <option value="OR">ANY condition (OR)</option>
          </select>
        </label>
      </div>
      <div class="rule-conditions" id="rule-conditions">
        <div class="rule-condition-row">
          <select class="cond-type">
            <option value="method">Method</option>
            <option value="consensus">Consensus</option>
          </select>
          <select class="cond-method">${methodOptions}</select>
          <select class="cond-direction">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
      </div>
      <div class="rule-form-actions">
        <button data-action="add-condition" type="button" class="btn btn-sm">+ Add Condition</button>
        <button data-action="create-rule" type="button" class="btn btn-primary btn-sm">Create Rule</button>
      </div>
    </details>`,
  );
}

export function renderAlertRulesSection(container: HTMLElement): {
  delegate: DelegateHandle;
  refresh: () => void;
} {
  // Create structure
  container.innerHTML = "";
  const rulesListEl = document.createElement("div");
  rulesListEl.className = "alert-rules-list";
  container.appendChild(rulesListEl);

  const formEl = document.createElement("div");
  formEl.className = "alert-rules-form";
  container.appendChild(formEl);

  function refresh(): void {
    renderRulesList(rulesListEl);
    renderCreateForm(formEl);
  }

  refresh();

  const methodOptions = METHODS.map((m) => `<option value="${m}">${m}</option>`).join("");

  const delegate = createDelegate(
    container,
    {
      "toggle-rule": (target) => {
        const id = target.dataset["id"];
        if (id) {
          toggleAlertRule(id);
          renderRulesList(rulesListEl);
        }
      },
      "delete-rule": (target) => {
        const id = target.dataset["id"];
        if (id) {
          removeAlertRule(id);
          renderRulesList(rulesListEl);
        }
      },
      "reset-rule": (target) => {
        const id = target.dataset["id"];
        if (id) {
          resetFiredRule(id);
          renderRulesList(rulesListEl);
        }
      },
      "add-condition": () => {
        const condContainer = container.querySelector("#rule-conditions");
        if (!condContainer) return;
        const row = document.createElement("div");
        row.className = "rule-condition-row";
        row.innerHTML = `
          <select class="cond-type">
            <option value="method">Method</option>
            <option value="consensus">Consensus</option>
          </select>
          <select class="cond-method">${methodOptions}</select>
          <select class="cond-direction">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <button class="btn-icon btn-danger" data-action="remove-condition" type="button">✕</button>`;
        condContainer.appendChild(row);
      },
      "remove-condition": (target) => {
        target.closest(".rule-condition-row")?.remove();
      },
      "create-rule": () => {
        const nameInput = container.querySelector<HTMLInputElement>("#rule-name");
        const tickerInput = container.querySelector<HTMLInputElement>("#rule-ticker");
        const operatorSelect = container.querySelector<HTMLSelectElement>("#rule-operator");
        const condRows = container.querySelectorAll(".rule-condition-row");

        const name = nameInput?.value.trim();
        const ticker = tickerInput?.value.trim().toUpperCase();
        const operator = (operatorSelect?.value ?? "AND") as AlertOperator;

        if (!name || !ticker) return;
        if (condRows.length === 0) return;

        const conditions: AlertCondition[] = [];
        condRows.forEach((row) => {
          const type = row.querySelector<HTMLSelectElement>(".cond-type")?.value as
            | "method"
            | "consensus";
          const method = row.querySelector<HTMLSelectElement>(".cond-method")?.value as MethodName;
          const direction = row.querySelector<HTMLSelectElement>(".cond-direction")?.value as
            | "BUY"
            | "SELL";
          conditions.push(
            type === "consensus"
              ? { type: "consensus", direction }
              : { type: "method", method, direction },
          );
        });

        if (conditions.length === 0) return;
        addAlertRule(name, ticker, operator, conditions);
        refresh();
      },
    },
    { eventTypes: ["click"] },
  );

  return { delegate, refresh };
}
