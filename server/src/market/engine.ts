import type { DataSource, PricePoint, TickerMeta } from "./types.js";
import { SimulatedDataSource } from "./simulatedDataSource.js";

const HISTORY_LIMIT = 500;

export type TickListener = (point: PricePoint) => void;

class MarketEngine {
  private source: DataSource;
  private latest = new Map<string, PricePoint>();
  private history = new Map<string, PricePoint[]>();
  private listeners = new Set<TickListener>();

  constructor(source: DataSource) {
    this.source = source;
    for (const meta of source.listSymbols()) {
      const point: PricePoint = { symbol: meta.symbol, price: meta.startPrice, ts: Date.now() };
      this.latest.set(meta.symbol, point);
      this.history.set(meta.symbol, [point]);
    }
  }

  start() {
    this.source.start((point) => {
      this.latest.set(point.symbol, point);
      const hist = this.history.get(point.symbol) ?? [];
      hist.push(point);
      if (hist.length > HISTORY_LIMIT) hist.shift();
      this.history.set(point.symbol, hist);
      for (const l of this.listeners) l(point);
    });
  }

  onTick(listener: TickListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getTickers(): TickerMeta[] {
    return this.source.listSymbols();
  }

  getLatestAll(): PricePoint[] {
    return [...this.latest.values()];
  }

  getLatest(symbol: string): PricePoint | undefined {
    return this.latest.get(symbol);
  }

  getHistory(symbol: string): PricePoint[] {
    return this.history.get(symbol) ?? [];
  }
}

export const marketEngine = new MarketEngine(new SimulatedDataSource());
