/**
 * Public API barrel for `src/cards` — route cards and chart drawing tools.
 *
 * Cards are lazy-loaded through the registry (`loadCard`), so importing this
 * barrel exposes the card contract without pulling every card into the bundle.
 */
export { loadCard, getCardEntry, listCards } from "./registry";
export type { CardEntry, CardHandle, CardContext, CardModule } from "./registry";

export { saveDrawings, loadDrawings, clearAllSavedDrawings } from "./drawing-persistence";

export { mountDrawingTools } from "./drawing-tools";
export type { DrawingToolHandle, DrawingToolMode, Drawing, Point } from "./drawing-tools";
