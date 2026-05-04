/**
 * Drawing undo/redo history — wraps a DrawingToolHandle with Ctrl+Z / Ctrl+Y support.
 *
 * Maintains a history stack of drawing states. Each mutation (add/clear) pushes
 * a snapshot. Undo pops to previous state, redo re-applies.
 *
 * Max history depth: 50 states.
 */
import type { Drawing, DrawingToolHandle } from "./drawing-tools";

const MAX_HISTORY = 50;

export interface DrawingHistoryHandle {
  /** Push current drawing state as a snapshot (call after each new drawing). */
  snapshot(): void;
  /** Undo last drawing action. Returns false if nothing to undo. */
  undo(): boolean;
  /** Redo previously undone action. Returns false if nothing to redo. */
  redo(): boolean;
  /** Whether undo is available. */
  canUndo(): boolean;
  /** Whether redo is available. */
  canRedo(): boolean;
  /** Dispose keyboard listener. */
  dispose(): void;
}

/**
 * Attach undo/redo history to a DrawingToolHandle.
 * Listens for Ctrl+Z / Ctrl+Y (or Cmd+Z / Cmd+Shift+Z on Mac) globally.
 */
export function attachDrawingHistory(handle: DrawingToolHandle): DrawingHistoryHandle {
  const undoStack: Drawing[][] = [];
  const redoStack: Drawing[][] = [];

  // Save initial (empty) state
  undoStack.push([...handle.getDrawings()]);

  function snapshot(): void {
    const current = [...handle.getDrawings()];
    undoStack.push(current);
    // Any new action invalidates the redo stack
    redoStack.length = 0;
    // Enforce max history
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
  }

  function undo(): boolean {
    if (undoStack.length <= 1) return false;
    const current = undoStack.pop()!;
    redoStack.push(current);
    const prev = undoStack[undoStack.length - 1]!;
    handle.setDrawings(prev);
    return true;
  }

  function redo(): boolean {
    if (redoStack.length === 0) return false;
    const next = redoStack.pop()!;
    undoStack.push(next);
    handle.setDrawings(next);
    return true;
  }

  function onKeyDown(e: KeyboardEvent): void {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    if (e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
      e.preventDefault();
      redo();
    }
  }

  document.addEventListener("keydown", onKeyDown);

  return {
    snapshot,
    undo,
    redo,
    canUndo: () => undoStack.length > 1,
    canRedo: () => redoStack.length > 0,
    dispose: () => document.removeEventListener("keydown", onKeyDown),
  };
}
