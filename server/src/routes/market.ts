import { Router } from "express";
import { marketEngine } from "../market/engine.js";

export const marketRouter = Router();

marketRouter.get("/tickers", (_req, res) => {
  const tickers = marketEngine.getTickers();
  const latest = new Map(marketEngine.getLatestAll().map((p) => [p.symbol, p]));
  res.json(
    tickers.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      price: latest.get(t.symbol)?.price ?? t.startPrice,
    }))
  );
});

marketRouter.get("/tickers/:symbol/history", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const history = marketEngine.getHistory(symbol);
  if (history.length === 0) {
    return res.status(404).json({ error: "Unknown symbol" });
  }
  res.json(history);
});
