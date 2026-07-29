/**
 * Consensus card adapter — CardModule wrapper for the consensus view.
 */
import { renderConsensus } from "./consensus";
import { tickerDataStore } from "../core/app-store";
import type { CardModule } from "./registry";

const consensusCard: CardModule = {
  mount(container, ctx) {
    let ticker = ctx.params["symbol"] ?? "";

    const render = (): void => {
      const result = tickerDataStore.peek().get(ticker)?.consensus ?? null;
      renderConsensus(container, ticker, result);
    };

    render();
    const unsubscribe = tickerDataStore.subscribe(render);

    return {
      update(newCtx): void {
        ticker = newCtx.params["symbol"] ?? "";
        render();
      },
      dispose(): void {
        unsubscribe();
      },
    };
  },
};

export default consensusCard;
