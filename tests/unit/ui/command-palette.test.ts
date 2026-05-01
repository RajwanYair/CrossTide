import { describe, it, expect } from "vitest";
import {
  scoreCommand,
  rankCommands,
  createPaletteState,
  type PaletteCommand,
} from "../../../src/ui/command-palette";

const noop = (): void => {
  /* */
};

const COMMANDS: PaletteCommand[] = [
  { id: "go.home", label: "Go Home", run: noop },
  { id: "watch.add", label: "Add Ticker", run: noop },
  { id: "watch.remove", label: "Remove Ticker", run: noop },
  { id: "theme.toggle", label: "Toggle Theme", run: noop },
];

describe("command-palette", () => {
  it("scoreCommand rewards exact matches", () => {
    expect(scoreCommand({ id: "x", label: "Go Home", run: noop }, "Go Home")).toBe(100);
  });

  it("scoreCommand rewards prefix", () => {
    expect(scoreCommand(COMMANDS[0]!, "go")).toBeGreaterThan(0);
  });

  it("scoreCommand returns -Infinity for no match", () => {
    expect(scoreCommand(COMMANDS[0]!, "xyz")).toBe(-Infinity);
  });

  it("scoreCommand returns 0 for empty query", () => {
    expect(scoreCommand(COMMANDS[0]!, "")).toBe(0);
  });

  it("scoreCommand matches subsequence", () => {
    expect(scoreCommand({ id: "x", label: "command palette", run: noop }, "cp")).toBeGreaterThan(0);
  });

  it("rankCommands sorts by score", () => {
    const r = rankCommands(COMMANDS, "ticker");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]?.label).toMatch(/Ticker/);
  });

  it("rankCommands returns all on empty query", () => {
    const r = rankCommands(COMMANDS, "");
    expect(r).toHaveLength(COMMANDS.length);
  });

  it("createPaletteState filters and tracks selection", () => {
    const p = createPaletteState(COMMANDS);
    expect(p.state().results).toHaveLength(COMMANDS.length);
    p.setQuery("Ticker");
    expect(p.state().results.every((c) => c.label.includes("Ticker"))).toBe(true);
    p.moveSelection(1);
    expect(p.state().selectedIndex).toBe(1);
  });

  it("moveSelection wraps around", () => {
    const p = createPaletteState(COMMANDS);
    p.moveSelection(-1);
    expect(p.state().selectedIndex).toBe(COMMANDS.length - 1);
    p.moveSelection(1);
    expect(p.state().selectedIndex).toBe(0);
  });

  it("selectedCommand returns null when no results", () => {
    const p = createPaletteState(COMMANDS);
    p.setQuery("zzz nothing");
    expect(p.selectedCommand()).toBeNull();
  });

  it("selectIndex bounds-checks", () => {
    const p = createPaletteState(COMMANDS);
    p.selectIndex(10);
    expect(p.state().selectedIndex).toBe(0);
    p.selectIndex(2);
    expect(p.state().selectedIndex).toBe(2);
  });
});
