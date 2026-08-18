import { Router } from "express";
import { db, STARTING_CASH } from "../db/index.js";
import { marketEngine } from "../market/engine.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", (_req, res) => {
  const users = db.prepare("SELECT id, username, cash FROM users").all() as {
    id: number;
    username: string;
    cash: number;
  }[];

  const holdingsByUser = db.prepare("SELECT user_id, symbol, quantity FROM holdings").all() as {
    user_id: number;
    symbol: string;
    quantity: number;
  }[];

  const holdingsMap = new Map<number, { symbol: string; quantity: number }[]>();
  for (const h of holdingsByUser) {
    const list = holdingsMap.get(h.user_id) ?? [];
    list.push({ symbol: h.symbol, quantity: h.quantity });
    holdingsMap.set(h.user_id, list);
  }

  const board = users
    .map((u) => {
      const holdings = holdingsMap.get(u.id) ?? [];
      const holdingsValue = holdings.reduce((sum, h) => {
        const price = marketEngine.getLatest(h.symbol)?.price ?? 0;
        return sum + price * h.quantity;
      }, 0);
      const netWorth = Math.round((u.cash + holdingsValue) * 100) / 100;
      const returnPct = Math.round(((netWorth - STARTING_CASH) / STARTING_CASH) * 10000) / 100;
      return { username: u.username, netWorth, returnPct };
    })
    .sort((a, b) => b.netWorth - a.netWorth)
    .slice(0, 50);

  res.json(board);
});
