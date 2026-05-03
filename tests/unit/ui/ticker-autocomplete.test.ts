/**
 * Ticker autocomplete widget tests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAutocomplete, type AutocompleteHandle } from "../../../src/ui/ticker-autocomplete";
import type { SearchResult } from "../../../src/providers/types";

const mockResults: SearchResult[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ" },
];

describe("ticker-autocomplete", () => {
  let handle: AutocompleteHandle;
  let onSelect: ReturnType<typeof vi.fn>;
  let onSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelect = vi.fn();
    onSearch = vi.fn().mockResolvedValue(mockResults);
    handle = createAutocomplete({ onSearch, onSelect, placeholder: "Test…" });
    document.body.appendChild(handle.element);
  });

  it("creates the DOM structure", () => {
    expect(handle.element.querySelector(".autocomplete-input")).not.toBeNull();
    expect(handle.element.querySelector(".autocomplete-listbox")).not.toBeNull();
  });

  it("input has combobox role and placeholder", () => {
    const input = handle.element.querySelector("input")!;
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.placeholder).toBe("Test…");
  });

  it("listbox is hidden initially", () => {
    const listbox = handle.element.querySelector("ul")!;
    expect(listbox.hidden).toBe(true);
  });

  it("calls onSearch after debounce on input", async () => {
    vi.useFakeTimers();
    const input = handle.element.querySelector("input")!;
    input.value = "AA";
    input.dispatchEvent(new Event("input"));
    expect(onSearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    expect(onSearch).toHaveBeenCalledWith("AA");
    vi.useRealTimers();
  });

  it("selects item on Enter with active index", async () => {
    vi.useFakeTimers();
    const input = handle.element.querySelector("input")!;
    input.value = "A";
    input.dispatchEvent(new Event("input"));
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    // ArrowDown to select first item
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(onSelect).toHaveBeenCalledWith("AAPL");
    vi.useRealTimers();
  });

  it("has accessible aria attributes", () => {
    const input = handle.element.querySelector("input")!;
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("aria-controls")).toBe("autocomplete-listbox");
  });

  it("dispose removes event handlers without error", () => {
    expect(() => handle.dispose()).not.toThrow();
  });
});
