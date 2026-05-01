import { describe, it, expect } from "vitest";
import {
  createReorderState,
  startDrag,
  dragOver,
  endDrag,
  moveItem,
} from "../../../src/ui/reorder";

describe("reorder", () => {
  it("createReorderState copies items", () => {
    const src = ["a", "b", "c"];
    const s = createReorderState(src);
    expect(s.items).toEqual(src);
    expect(s.items).not.toBe(src);
    expect(s.draggingIndex).toBeNull();
  });

  it("startDrag sets index", () => {
    const s = startDrag(createReorderState(["a", "b"]), 1);
    expect(s.draggingIndex).toBe(1);
  });

  it("startDrag rejects out-of-range", () => {
    const s = startDrag(createReorderState(["a", "b"]), 99);
    expect(s.draggingIndex).toBeNull();
  });

  it("dragOver reorders forward", () => {
    let s = createReorderState(["a", "b", "c", "d"]);
    s = startDrag(s, 0);
    s = dragOver(s, 3);
    expect(s.items).toEqual(["b", "c", "a", "d"]);
    expect(s.draggingIndex).toBe(2);
  });

  it("dragOver reorders backward", () => {
    let s = createReorderState(["a", "b", "c", "d"]);
    s = startDrag(s, 3);
    s = dragOver(s, 1);
    expect(s.items).toEqual(["a", "d", "b", "c"]);
    expect(s.draggingIndex).toBe(1);
  });

  it("dragOver to end moves to last", () => {
    let s = createReorderState(["a", "b", "c"]);
    s = startDrag(s, 0);
    s = dragOver(s, 3);
    expect(s.items).toEqual(["b", "c", "a"]);
  });

  it("dragOver no-op when no drag active", () => {
    const s = dragOver(createReorderState(["a", "b"]), 1);
    expect(s.items).toEqual(["a", "b"]);
  });

  it("endDrag clears index", () => {
    let s = createReorderState(["a", "b"]);
    s = startDrag(s, 0);
    s = endDrag(s);
    expect(s.draggingIndex).toBeNull();
  });

  it("moveItem reorders without state", () => {
    expect(moveItem([1, 2, 3, 4], 0, 3)).toEqual([2, 3, 4, 1]);
    expect(moveItem([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
  });

  it("moveItem rejects bad source", () => {
    expect(moveItem([1, 2, 3], 99, 0)).toEqual([1, 2, 3]);
  });
});
