import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError, type ScenarioState, type ScenarioSummary } from "../api/client";
import { ScenarioChart } from "../components/ScenarioChart";

const MAX_POINTS = 300;

export function CrisisPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [state, setState] = useState<ScenarioState | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const historyRef = useRef<Map<string, { day: number; price: number }[]>>(new Map());
  const [, forceTick] = useState(0);

  useEffect(() => {
    api.scenarioList().then(setScenarios);
    api
      .scenarioState()
      .then((s) => setState(s))
      .catch(() => {})
      .finally(() => setCheckingActive(false));
  }, []);

  useEffect(() => {
    if (!state) return;
    if (!selectedSymbol && state.tickers.length > 0) setSelectedSymbol(state.tickers[0].symbol);
  }, [state, selectedSymbol]);

  useEffect(() => {
    if (!state || state.finished) return;
    const interval = setInterval(async () => {
      try {
        const next = await api.scenarioState();
        setState(next);
        for (const t of next.tickers) {
          const hist = historyRef.current.get(t.symbol) ?? [];
          hist.push({ day: next.simDay, price: t.price });
          if (hist.length > MAX_POINTS) hist.shift();
          historyRef.current.set(t.symbol, hist);
        }
        forceTick((n) => n + 1);
      } catch {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.scenario.id, state?.finished]);

  async function handleStart(id: string) {
    setStarting(id);
    historyRef.current = new Map();
    setSelectedSymbol(null);
    try {
      await api.scenarioStart(id);
      const s = await api.scenarioState();
      setState(s);
    } finally {
      setStarting(null);
    }
  }

  async function handleStop() {
    await api.scenarioStop();
    setState(null);
    historyRef.current = new Map();
    setSelectedSymbol(null);
  }

  if (checkingActive) {
    return <div className="page-loading">Loading…</div>;
  }

  if (!state) {
    return (
      <div className="crisis-page">
        <h2>Crisis Simulator</h2>
        <p className="muted">
          Relive a historical market crash, compressed into a few minutes. You get a fresh $100,000 practice
          balance, separate from your main portfolio — trade through the crash and see how you'd have done.
        </p>
        <div className="scenario-grid">
          {scenarios.map((s) => (
            <div key={s.id} className="scenario-card">
              <h3>{s.name}</h3>
              <span className="scenario-daterange">{s.dateRange}</span>
              <p>{s.description}</p>
              <div className="scenario-stat">
                Peak-to-trough <strong className="negative">{s.peakToTroughPct}%</strong>
              </div>
              <button className="btn-primary" onClick={() => handleStart(s.id)} disabled={starting === s.id}>
                {starting === s.id ? "Starting…" : "Start scenario"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const points = selectedSymbol ? historyRef.current.get(selectedSymbol) ?? [] : [];
  const selectedTicker = state.tickers.find((t) => t.symbol === selectedSymbol);

  return (
    <div className="crisis-active">
      <div className="crisis-topbar">
        <div>
          <h2>{state.scenario.name}</h2>
          <span className="muted">{new Date(state.currentDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <button className="btn-secondary" onClick={handleStop}>
          {state.finished ? "Exit scenario" : "Stop & return to live market"}
        </button>
      </div>

      <div className="crisis-progress">
        <div className="crisis-progress-bar">
          <div className="crisis-progress-fill" style={{ width: `${state.progress * 100}%` }} />
        </div>
        {state.finished && <span className="crisis-finished-badge">Scenario complete</span>}
      </div>

      <div className="crisis-layout">
        <div className="crisis-sidebar">
          <h3>Tickers</h3>
          <ul className="ticker-list">
            {state.tickers.map((t) => (
              <li
                key={t.symbol}
                className={`ticker-row ${selectedSymbol === t.symbol ? "selected" : ""}`}
                onClick={() => setSelectedSymbol(t.symbol)}
              >
                <div className="ticker-info">
                  <span className="ticker-symbol">{t.symbol}</span>
                  <span className="ticker-name">{t.name}</span>
                </div>
                <span className="ticker-price">${t.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <h3>Events</h3>
          <ul className="event-feed">
            {state.events.length === 0 && <li className="muted">No events yet…</li>}
            {[...state.events].reverse().map((e) => (
              <li key={e.day}>
                <span className="event-date">{e.date}</span>
                <span>{e.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="crisis-main">
          {selectedSymbol && (
            <div className="dashboard-chart-card">
              <h2>
                {selectedSymbol} <span className="muted">{selectedTicker?.name}</span>
              </h2>
              <ScenarioChart points={points} />
            </div>
          )}

          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">Scenario net worth</span>
              <span className="summary-value">${state.portfolio.netWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Cash</span>
              <span className="summary-value">${state.portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Return vs $100,000 start</span>
              <span className={`summary-value ${state.portfolio.netWorth >= 100000 ? "positive" : "negative"}`}>
                {(((state.portfolio.netWorth - 100000) / 100000) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {state.portfolio.positions.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg cost</th>
                  <th>Price</th>
                  <th>Unrealized P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {state.portfolio.positions.map((p) => (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td>{p.quantity}</td>
                    <td>${p.avgCost.toFixed(2)}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td className={p.unrealizedPnl >= 0 ? "positive" : "negative"}>
                      {p.unrealizedPnl >= 0 ? "+" : ""}
                      ${p.unrealizedPnl.toFixed(2)} ({p.unrealizedPnlPct}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="crisis-trade">
          {selectedSymbol && !state.finished && (
            <ScenarioTradePanel
              symbol={selectedSymbol}
              price={selectedTicker?.price ?? 0}
              onTraded={async () => setState(await api.scenarioState())}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioTradePanel({
  symbol,
  price,
  onTraded,
}: {
  symbol: string;
  price: number;
  onTraded: () => void;
}) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const qtyNum = Number(quantity);
  const estimate = price && qtyNum > 0 ? price * qtyNum : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!qtyNum || qtyNum <= 0) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await api.scenarioOrder(symbol, side, qtyNum);
      setStatus({ kind: "ok", message: `${side === "BUY" ? "Bought" : "Sold"} ${qtyNum} ${symbol} @ $${res.price.toFixed(2)}` });
      onTraded();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof ApiError ? err.message : "Order failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="trade-panel" onSubmit={onSubmit}>
      <h3>Trade {symbol}</h3>
      <div className="trade-side-toggle">
        <button type="button" className={side === "BUY" ? "active buy" : ""} onClick={() => setSide("BUY")}>
          Buy
        </button>
        <button type="button" className={side === "SELL" ? "active sell" : ""} onClick={() => setSide("SELL")}>
          Sell
        </button>
      </div>
      <label>
        Quantity
        <input type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </label>
      <div className="trade-estimate">
        <span>Market price</span>
        <span>${price.toFixed(2)}</span>
      </div>
      <div className="trade-estimate">
        <span>Estimated total</span>
        <span>${estimate.toFixed(2)}</span>
      </div>
      {status && <div className={status.kind === "ok" ? "form-success" : "form-error"}>{status.message}</div>}
      <button type="submit" className={`btn-primary ${side === "SELL" ? "btn-sell" : ""}`} disabled={submitting}>
        {submitting ? "Placing order…" : `${side === "BUY" ? "Buy" : "Sell"} ${symbol}`}
      </button>
    </form>
  );
}
