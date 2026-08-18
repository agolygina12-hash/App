import { useEffect, useState } from "react";
import { api, type Order, type Portfolio } from "../api/client";

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [p, o] = await Promise.all([api.portfolio(), api.orders()]);
    setPortfolio(p);
    setOrders(o);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !portfolio) return <div className="page-loading">Loading portfolio…</div>;

  return (
    <div className="portfolio-page">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Net worth</span>
          <span className="summary-value">${portfolio.netWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Cash</span>
          <span className="summary-value">${portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Holdings value</span>
          <span className="summary-value">${portfolio.holdingsValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <h2>Positions</h2>
      {portfolio.positions.length === 0 ? (
        <p className="muted">No open positions yet — head to the Market tab to place your first trade.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Avg cost</th>
              <th>Price</th>
              <th>Market value</th>
              <th>Unrealized P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.positions.map((p) => (
              <tr key={p.symbol}>
                <td>{p.symbol}</td>
                <td>{p.quantity}</td>
                <td>${p.avgCost.toFixed(2)}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>${p.marketValue.toFixed(2)}</td>
                <td className={p.unrealizedPnl >= 0 ? "positive" : "negative"}>
                  {p.unrealizedPnl >= 0 ? "+" : ""}
                  ${p.unrealizedPnl.toFixed(2)} ({p.unrealizedPnlPct}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Order history</h2>
      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i}>
                <td>{new Date(o.created_at + "Z").toLocaleString()}</td>
                <td>{o.symbol}</td>
                <td className={o.side === "BUY" ? "positive" : "negative"}>{o.side}</td>
                <td>{o.quantity}</td>
                <td>${o.price.toFixed(2)}</td>
                <td>${o.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
