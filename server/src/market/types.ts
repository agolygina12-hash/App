export interface TickerMeta {
  symbol: string;
  name: string;
  startPrice: number;
  volatility: number; // rough daily volatility, e.g. 0.02 = 2%
}

export interface PricePoint {
  symbol: string;
  price: number;
  ts: number; // epoch ms
}

export interface DataSource {
  listSymbols(): TickerMeta[];
  start(onTick: (point: PricePoint) => void): void;
  stop(): void;
}
