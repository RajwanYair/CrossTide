/**
 * Signal DSL card tests (D4).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "../../../src/cards/signal-dsl-card";
import type { CardContext } from "../../../src/cards/registry";

const CTX: CardContext = { route: "signal-dsl", params: {} };

describe("signal-dsl card", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    mount(container, CTX);
  });

  it("renders expression textarea and evaluate button", () => {
    expect(container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")).not.toBeNull();
    expect(container.querySelector<HTMLButtonElement>("#dsl-eval-btn")).not.toBeNull();
  });

  it("renders variables textarea", () => {
    expect(container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")).not.toBeNull();
  });

  it("shows 'Enter an expression' message when expression is empty", () => {
    const btn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
    btn.click();
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;
    expect(result.textContent).toContain("Enter an expression");
  });

  it("evaluates a simple numeric expression", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const vars = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
    const btn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "2 + 3";
    vars.value = "{}";
    btn.click();

    expect(result.textContent).toContain("5");
  });

  it("evaluates a boolean expression (true path)", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const vars = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
    const btn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "rsi < 30";
    vars.value = '{"rsi": 25}';
    btn.click();

    expect(result.textContent).toContain("true");
  });

  it("evaluates a boolean expression (false path)", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const vars = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
    const btn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "rsi < 30";
    vars.value = '{"rsi": 45}';
    btn.click();

    expect(result.textContent).toContain("false");
  });

  it("shows error for invalid JSON variables", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const vars = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
    const btn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "price > 100";
    vars.value = "not-json";
    btn.click();

    expect(result.textContent?.toLowerCase()).toContain("variables");
  });

  it("shows error for syntax error in expression", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const vars = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
    const btn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "rsi <<<";
    vars.value = '{"rsi": 25}';
    btn.click();

    expect(result.textContent?.toLowerCase()).toContain("error");
  });

  it("clear button empties inputs and result", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const vars = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
    const clearBtn = container.querySelector<HTMLButtonElement>("#dsl-clear-btn")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "1 + 1";
    vars.value = "{}";
    result.innerHTML = "something";
    clearBtn.click();

    expect(expr.value).toBe("");
    expect(vars.value).toBe("");
    expect(result.innerHTML).toBe("");
  });

  it("Ctrl+Enter in expression textarea triggers evaluation", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "10 * 5";
    const event = new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true });
    expr.dispatchEvent(event);

    expect(result.textContent).toContain("50");
  });

  it("evaluates with built-in abs() function", () => {
    const expr = container.querySelector<HTMLTextAreaElement>("#dsl-expr-input")!;
    const vars = container.querySelector<HTMLTextAreaElement>("#dsl-vars-input")!;
    const btn = container.querySelector<HTMLButtonElement>("#dsl-eval-btn")!;
    const result = container.querySelector<HTMLDivElement>("#dsl-result-area")!;

    expr.value = "abs(change) > 5";
    vars.value = '{"change": -8}';
    btn.click();

    expect(result.textContent).toContain("true");
  });
});
