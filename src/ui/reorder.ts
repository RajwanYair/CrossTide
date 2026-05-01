/**
 * Drag-reorder list state machine — pure logic for keyboard- and
 * pointer-driven reordering. The DOM layer just calls into this module
 * with indices and reads the resulting array.
 */

export interface ReorderState<T> {
  readonly items: readonly T[];
  readonly draggingIndex: number | null;
}

export function createReorderState<T>(items: readonly T[]): ReorderState<T> {
  return { items: [...items], draggingIndex: null };
}

export function startDrag<T>(state: ReorderState<T>, index: number): ReorderState<T> {
  if (index < 0 || index >= state.items.length) return state;
  return { items: state.items, draggingIndex: index };
}

/**
 * Move the currently-dragged item so it lands *before* `targetIndex` in
 * the new array. If targetIndex equals items.length, the item is moved
 * to the end. No-op if no drag is active or target is the same slot.
 */
export function dragOver<T>(state: ReorderState<T>, targetIndex: number): ReorderState<T> {
  const from = state.draggingIndex;
  if (from === null) return state;
  const len = state.items.length;
  const clamped = Math.max(0, Math.min(targetIndex, len));
  if (clamped === from || clamped === from + 1) return state;
  const next = [...state.items];
  const item = next[from] as T;
  next.splice(from, 1);
  // Adjust insertion index if we removed from before it
  const insertAt = clamped > from ? clamped - 1 : clamped;
  next.splice(insertAt, 0, item);
  const newDragIndex = insertAt;
  return { items: next, draggingIndex: newDragIndex };
}

export function endDrag<T>(state: ReorderState<T>): ReorderState<T> {
  if (state.draggingIndex === null) return state;
  return { items: state.items, draggingIndex: null };
}

/** Move the item at `from` to position `to` (declarative version). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) return [...items];
  const next = [...items];
  const item = next[from] as T;
  next.splice(from, 1);
  const insertAt = Math.max(0, Math.min(to, next.length));
  next.splice(insertAt, 0, item);
  return next;
}
