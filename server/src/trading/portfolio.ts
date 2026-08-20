import { db } from "../db/index.js";
import { marketEngine } from "../market/engine.js";

export interface Position {
  symbol: string;
  quantity: number;
  avgCost: number;
  price: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

export interface Portfolio {
  cash: number;
  holdingsValue: number;
  netWorth: number;
  positions: Position[];
}

export function getPortfolio(userId: number): Portfolio {
  const user = db.prepare("SELECT cash FROM users WHERE id = ?").get(userId) as { cash: number };
  const holdings = db
    .prepare("SELECT symbol, quantity, avg_cost FROM holdings WHERE user_id = ?")
    .all(userId) as { symbol: string; quantity: number; avg_cost: number }[];

  const positions: Position[] = holdings.map((h) => {
    const price = marketEngine.getLatest(h.symbol)?.price ?? h.avg_cost;
    const marketValue = Math.round(price * h.quantity * 100) / 100;
    const costBasis = Math.round(h.avg_cost * h.quantity * 100) / 100;
    return {
      symbol: h.symbol,
      quantity: h.quantity,
      avgCost: h.avg_cost,
      price,
      marketValue,
      costBasis,
      unrealizedPnl: Math.round((marketValue - costBasis) * 100) / 100,
      unrealizedPnlPct: costBasis > 0 ? Math.round(((marketValue - costBasis) / costBasis) * 10000) / 100 : 0,
    };
  });

  const holdingsValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const netWorth = Math.round((user.cash + holdingsValue) * 100) / 100;

  return { cash: user.cash, holdingsValue: Math.round(holdingsValue * 100) / 100, netWorth, positions };
}
