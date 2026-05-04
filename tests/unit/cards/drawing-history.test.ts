import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { attachDrawingHistory } from "../../../src/cards/drawing-history";
import type { Drawing, DrawingToolHandle } from "../../../src/cards/drawing-tools";

function createMockHandle(): DrawingToolHandle & { drawings: Drawing[] } {
  const state: { drawings: Drawing[] } = { drawings: [] };
  return {
    get drawings() {
      return state.drawings;
    },
    setTool: () => undefined,
    clearDrawings: () => {
      state.drawings = [];
    },
    setDrawings: (d: readonly Drawing[]) => {
      state.drawings = [...d];
    },
    getDrawings: () => state.drawings,
    dispose: () => undefined,
  };
}

describe("drawing-history (undo/redo)", () => {
  let handle: ReturnType<typeof createMockHandle>;
  let history: ReturnType<typeof attachDrawingHistory>;

  const trendline: Drawing = {
    kind: "trendline",
    p1: { x: 0, y: 0 },
    p2: { x: 100, y: 100 },
    color: "#f00",
  };

  const fib: Drawing = {
    kind: "fib",
    high: { x: 0, y: 0 },
    low: { x: 0, y: 100 },
    color: "#00f",
  };

  beforeEach(() => {
    handle = createMockHandle();
    history = attachDrawingHistory(handle);
  });

  afterEach(() => {
    history.dispose();
  });

  it("starts with canUndo=false and canRedo=false", () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("can undo after snapshot", () => {
    handle.drawings.push(trendline);
    history.snapshot();
    expect(history.canUndo()).toBe(true);

    history.undo();
    expect(handle.getDrawings()).toHaveLength(0);
  });

  it("can redo after undo", () => {
    handle.drawings.push(trendline);
    history.snapshot();

    history.undo();
    expect(history.canRedo()).toBe(true);

    history.redo();
    expect(handle.getDrawings()).toHaveLength(1);
    expect(handle.getDrawings()[0]).toEqual(trendline);
  });

  it("redo stack is cleared on new snapshot", () => {
    handle.drawings.push(trendline);
    history.snapshot();
    history.undo();
    expect(history.canRedo()).toBe(true);

    // New action invalidates redo
    handle.drawings.push(fib);
    history.snapshot();
    expect(history.canRedo()).toBe(false);
  });

  it("multiple undo steps work", () => {
    handle.drawings.push(trendline);
    history.snapshot();
    handle.drawings.push(fib);
    history.snapshot();

    expect(handle.getDrawings()).toHaveLength(2);
    history.undo();
    expect(handle.getDrawings()).toHaveLength(1);
    history.undo();
    expect(handle.getDrawings()).toHaveLength(0);
  });

  it("undo returns false when nothing to undo", () => {
    expect(history.undo()).toBe(false);
  });

  it("redo returns false when nothing to redo", () => {
    expect(history.redo()).toBe(false);
  });

  it("responds to Ctrl+Z keyboard event", () => {
    handle.drawings.push(trendline);
    history.snapshot();

    const event = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
    expect(handle.getDrawings()).toHaveLength(0);
  });

  it("responds to Ctrl+Y keyboard event", () => {
    handle.drawings.push(trendline);
    history.snapshot();
    history.undo();

    const event = new KeyboardEvent("keydown", {
      key: "y",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
    expect(handle.getDrawings()).toHaveLength(1);
  });

  it("enforces max history depth of 50", () => {
    for (let i = 0; i < 60; i++) {
      handle.drawings.push({ ...trendline, p2: { x: i, y: i } });
      history.snapshot();
    }
    // Should be able to undo many times but internal stack capped at 50
    let undoCount = 0;
    while (history.undo()) undoCount++;
    expect(undoCount).toBeLessThanOrEqual(50);
  });
});
