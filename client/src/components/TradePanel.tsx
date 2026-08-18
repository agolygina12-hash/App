import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import { useMarket } from "../context/MarketContext";

interface Props {
  symbol: string;
  name: string;
  onTraded: () => void;
}

export function TradePanel({ symbol, name, onTraded }: Props) {
  const { prices } = useMarket();
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const price = prices[symbol]?.price;
  const qtyNum = Number(quantity);
  const estimate = price && qtyNum > 0 ? price * qtyNum : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!qtyNum || qtyNum <= 0) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await api.placeOrder(symbol, side, qtyNum);
      setStatus({
        kind: "ok",
        message: `${side === "BUY" ? "Bought" : "Sold"} ${qtyNum} ${symbol} @ $${res.price.toFixed(2)}`,
      });
      onTraded();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof ApiError ? err.message : "Order failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="trade-panel" onSubmit={onSubmit}>
      <h3>
        Trade {symbol} <span className="trade-panel-name">{name}</span>
      </h3>
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
        <input
          type="number"
          min="0.0001"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      <div className="trade-estimate">
        <span>Market price</span>
        <span>{price ? `$${price.toFixed(2)}` : "—"}</span>
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
