import { useEffect, useState } from "react";
import { api, type Ticker } from "../api/client";
import { TickerList } from "../components/TickerList";
import { PriceChart } from "../components/PriceChart";
import { TradePanel } from "../components/TradePanel";

export function DashboardPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.tickers().then(setTickers);
  }, [refreshKey]);

  const activeTicker = tickers.find((t) => t.symbol === selected);

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <h2>Markets</h2>
        <TickerList selected={selected} onSelect={setSelected} />
      </div>
      <div className="dashboard-main">
        {selected ? (
          <>
            <div className="dashboard-chart-card">
              <h2>
                {selected} {activeTicker && <span className="muted">{activeTicker.name}</span>}
              </h2>
              <PriceChart symbol={selected} />
            </div>
          </>
        ) : (
          <div className="chart-placeholder">Select a ticker to view its chart</div>
        )}
      </div>
      <div className="dashboard-trade">
        {selected && (
          <TradePanel symbol={selected} name={activeTicker?.name ?? ""} onTraded={() => setRefreshKey((k) => k + 1)} />
        )}
      </div>
    </div>
  );
}
