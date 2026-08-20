import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { marketEngine } from "../market/engine.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getPortfolio } from "../trading/portfolio.js";

export const tradingRouter = Router();
tradingRouter.use(requireAuth);

const orderSchema = z.object({
  symbol: z.string().trim().min(1).max(10),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive().finite(),
});

const placeOrder = db.transaction(
  (userId: number, symbol: string, side: "BUY" | "SELL", quantity: number, price: number) => {
    const user = db.prepare("SELECT cash FROM users WHERE id = ?").get(userId) as { cash: number };
    const holding = db
      .prepare("SELECT quantity, avg_cost FROM holdings WHERE user_id = ? AND symbol = ?")
      .get(userId, symbol) as { quantity: number; avg_cost: number } | undefined;

    const total = Math.round(price * quantity * 100) / 100;

    if (side === "BUY") {
      if (user.cash < total) throw new Error("INSUFFICIENT_FUNDS");
      db.prepare("UPDATE users SET cash = cash - ? WHERE id = ?").run(total, userId);

      if (holding) {
        const newQty = holding.quantity + quantity;
        const newAvgCost = (holding.avg_cost * holding.quantity + total) / newQty;
        db.prepare("UPDATE holdings SET quantity = ?, avg_cost = ? WHERE user_id = ? AND symbol = ?").run(
          newQty,
          newAvgCost,
          userId,
          symbol
        );
      } else {
        db.prepare(
          "INSERT INTO holdings (user_id, symbol, quantity, avg_cost) VALUES (?, ?, ?, ?)"
        ).run(userId, symbol, quantity, price);
      }
    } else {
      if (!holding || holding.quantity < quantity) throw new Error("INSUFFICIENT_SHARES");
      db.prepare("UPDATE users SET cash = cash + ? WHERE id = ?").run(total, userId);

      const remaining = holding.quantity - quantity;
      if (remaining <= 1e-9) {
        db.prepare("DELETE FROM holdings WHERE user_id = ? AND symbol = ?").run(userId, symbol);
      } else {
        db.prepare("UPDATE holdings SET quantity = ? WHERE user_id = ? AND symbol = ?").run(
          remaining,
          userId,
          symbol
        );
      }
    }

    db.prepare(
      "INSERT INTO orders (user_id, symbol, side, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(userId, symbol, side, quantity, price, total);
  }
);

tradingRouter.post("/orders", (req: AuthedRequest, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid order" });
  }
  const { side, quantity } = parsed.data;
  const symbol = parsed.data.symbol.toUpperCase();

  const quote = marketEngine.getLatest(symbol);
  if (!quote) return res.status(404).json({ error: "Unknown symbol" });

  try {
    placeOrder(req.userId!, symbol, side, quantity, quote.price);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order failed";
    if (message === "INSUFFICIENT_FUNDS") return res.status(400).json({ error: "Insufficient cash" });
    if (message === "INSUFFICIENT_SHARES") return res.status(400).json({ error: "Insufficient shares" });
    return res.status(500).json({ error: "Order failed" });
  }

  res.status(201).json({ ok: true, symbol, side, quantity, price: quote.price });
});

tradingRouter.get("/portfolio", (req: AuthedRequest, res) => {
  res.json(getPortfolio(req.userId!));
});

tradingRouter.get("/orders", (req: AuthedRequest, res) => {
  const orders = db
    .prepare("SELECT symbol, side, quantity, price, total, created_at FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 200")
    .all(req.userId!);
  res.json(orders);
});
