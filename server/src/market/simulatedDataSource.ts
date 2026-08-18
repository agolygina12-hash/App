import type { DataSource, PricePoint, TickerMeta } from "./types.js";

export const DEFAULT_TICKERS: TickerMeta[] = [
  { symbol: "ACME", name: "Acme Corp", startPrice: 142.5, volatility: 0.018 },
  { symbol: "NVAI", name: "Nova AI Systems", startPrice: 780.2, volatility: 0.035 },
  { symbol: "BLTS", name: "Bolt Motors", startPrice: 24.8, volatility: 0.03 },
  { symbol: "GLBK", name: "Global Bank Corp", startPrice: 58.15, volatility: 0.012 },
  { symbol: "SUNE", name: "SunEdge Energy", startPrice: 33.4, volatility: 0.025 },
  { symbol: "PIXL", name: "Pixel Interactive", startPrice: 96.75, volatility: 0.028 },
  { symbol: "MEDX", name: "MedixHealth", startPrice: 210.0, volatility: 0.016 },
  { symbol: "FRSH", name: "FreshFoods Co", startPrice: 45.6, volatility: 0.014 },
  { symbol: "AEROD", name: "Aerodyne Industries", startPrice: 315.9, volatility: 0.02 },
  { symbol: "QNTM", name: "Quantum Computing Inc", startPrice: 12.35, volatility: 0.05 },
];

// Simple mean-reverting random walk (Ornstein-Uhlenbeck-ish) per symbol,
// plus occasional volatility spikes, to look like a live tape.
export class SimulatedDataSource implements DataSource {
  private tickers: TickerMeta[];
  private prices = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;
  private tickMs: number;

  constructor(tickers: TickerMeta[] = DEFAULT_TICKERS, tickMs = 1500) {
    this.tickers = tickers;
    this.tickMs = tickMs;
    for (const t of tickers) this.prices.set(t.symbol, t.startPrice);
  }

  listSymbols(): TickerMeta[] {
    return this.tickers;
  }

  start(onTick: (point: PricePoint) => void): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      for (const meta of this.tickers) {
        const current = this.prices.get(meta.symbol)!;
        const next = this.stepPrice(current, meta);
        this.prices.set(meta.symbol, next);
        onTick({ symbol: meta.symbol, price: next, ts: Date.now() });
      }
    }, this.tickMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private stepPrice(current: number, meta: TickerMeta): number {
    // per-tick vol scaled down from a "daily" figure
    const perTickVol = meta.volatility / Math.sqrt(390); // ~390 "minutes" in a trading day
    const pctDrift = ((meta.startPrice - current) / current) * 0.002; // gentle pull back toward baseline
    const spike = Math.random() < 0.01 ? (Math.random() - 0.5) * meta.volatility * 4 : 0;
    const pctShock = randNormal() * perTickVol + spike;
    const next = current * (1 + pctDrift + pctShock);
    return Math.max(0.5, Math.round(next * 100) / 100);
  }
}

function randNormal(): number {
  // Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
