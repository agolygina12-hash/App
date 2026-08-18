import { useEffect, useState } from "react";
import { api, type Ticker } from "../api/client";
import { useMarket } from "../context/MarketContext";

interface Props {
  selected: string | null;
  onSelect: (symbol: string) => void;
}

export function TickerList({ selected, onSelect }: Props) {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const { prices } = useMarket();

  useEffect(() => {
    api.tickers().then((data) => {
      setTickers(data);
      if (!selected && data.length > 0) onSelect(data[0].symbol);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const t of tickers) {
      const live = prices[t.symbol];
      if (live) next[t.symbol] = live.price;
    }
    const timer = setTimeout(() => setPrevPrices(next), 400);
    return () => clearTimeout(timer);
  }, [prices, tickers]);

  return (
    <ul className="ticker-list">
      {tickers.map((t) => {
        const live = prices[t.symbol]?.price ?? t.price;
        const prev = prevPrices[t.symbol] ?? live;
        const dir = live > prev ? "up" : live < prev ? "down" : "flat";
        return (
          <li
            key={t.symbol}
            className={`ticker-row ${selected === t.symbol ? "selected" : ""}`}
            onClick={() => onSelect(t.symbol)}
          >
            <div className="ticker-info">
              <span className="ticker-symbol">{t.symbol}</span>
              <span className="ticker-name">{t.name}</span>
            </div>
            <span className={`ticker-price flash-${dir}`}>${live.toFixed(2)}</span>
          </li>
        );
      })}
    </ul>
  );
}
