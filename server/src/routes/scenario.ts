import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { SCENARIOS, getScenario } from "../market/scenarios.js";
import {
  currentSimDay,
  getActiveScenario,
  getPrices,
  getScenarioPortfolio,
  placeScenarioOrder,
  revealedEvents,
  startScenario,
  stopScenario,
} from "../market/scenarioEngine.js";

export const scenarioRouter = Router();
scenarioRouter.use(requireAuth);

scenarioRouter.get("/list", (_req, res) => {
  res.json(
    SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      dateRange: s.dateRange,
      description: s.description,
      peakToTroughPct: s.peakToTroughPct,
      durationDays: s.durationDays,
    }))
  );
});

scenarioRouter.post("/:id/start", (req: AuthedRequest, res) => {
  const scenario = getScenario(req.params.id);
  if (!scenario) return res.status(404).json({ error: "Unknown scenario" });
  startScenario(req.userId!, req.params.id);
  res.status(201).json({ ok: true });
});

scenarioRouter.post("/stop", (req: AuthedRequest, res) => {
  stopScenario(req.userId!);
  res.json({ ok: true });
});

scenarioRouter.get("/state", (req: AuthedRequest, res) => {
  const active = getActiveScenario(req.userId!);
  if (!active) return res.status(404).json({ error: "No active scenario" });
  const { run, scenario } = active;

  const simDay = currentSimDay(run, scenario);
  const progress = Math.min(1, simDay / scenario.durationDays);
  const currentDate = new Date(new Date(scenario.startDate).getTime() + simDay * 86_400_000);

  res.json({
    scenario: {
      id: scenario.id,
      name: scenario.name,
      dateRange: scenario.dateRange,
      description: scenario.description,
      peakToTroughPct: scenario.peakToTroughPct,
    },
    simDay,
    progress,
    finished: progress >= 1,
    currentDate: currentDate.toISOString(),
    tickers: getPrices(scenario, simDay),
    events: revealedEvents(scenario, simDay),
    portfolio: getScenarioPortfolio(run, scenario, simDay),
  });
});

const orderSchema = z.object({
  symbol: z.string().trim().min(1).max(10),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive().finite(),
});

scenarioRouter.post("/orders", (req: AuthedRequest, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid order" });
  }
  const { side, quantity } = parsed.data;
  const symbol = parsed.data.symbol.toUpperCase();

  try {
    const result = placeScenarioOrder(req.userId!, symbol, side, quantity);
    res.status(201).json({ ok: true, symbol, side, quantity, price: result.price });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order failed";
    if (message === "NO_ACTIVE_SCENARIO") return res.status(400).json({ error: "No active scenario" });
    if (message === "UNKNOWN_SYMBOL") return res.status(404).json({ error: "Unknown symbol" });
    if (message === "INSUFFICIENT_FUNDS") return res.status(400).json({ error: "Insufficient cash" });
    if (message === "INSUFFICIENT_SHARES") return res.status(400).json({ error: "Insufficient shares" });
    res.status(500).json({ error: "Order failed" });
  }
});
