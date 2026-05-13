/**
 * lit-html rendering adapter — Q27.
 *
 * Provides a thin wrapper around lit-html's `render()` and `html` tagged
 * template so card modules can gradually migrate from innerHTML/patchDOM
 * to declarative templates with efficient DOM diffing.
 *
 * Usage:
 *   import { html, renderLit } from "../ui/lit-render";
 *
 *   renderLit(container, html`
 *     <div class="card">
 *       <h2>${title}</h2>
 *       <button @click=${() => handleClick()}>Action</button>
 *     </div>
 *   `);
 */
import { html, render, nothing, type TemplateResult } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";
import { ifDefined } from "lit-html/directives/if-defined.js";
import { repeat } from "lit-html/directives/repeat.js";

/**
 * Render a lit-html template into a container element.
 * Wraps lit-html's `render()` with a consistent API.
 */
function renderLit(container: HTMLElement, template: TemplateResult): void {
  render(template, container);
}

export { html, renderLit, nothing, classMap, ifDefined, repeat };
export type { TemplateResult };
