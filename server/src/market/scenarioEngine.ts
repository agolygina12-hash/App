import { marketEngine } from "./engine.js";
import { getScenario, indexLevelAt, type Scenario, type ScenarioEvent } from "./scenarios.js";

export const PLAYBACK_SECONDS = 240;
export const START_CASH = 100_000;

interface ScenarioPosition {
  quantity: number;
  avgCost: number;
}

interface ScenarioOrder {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  simDay: number;
}

interface ScenarioRun {
  scenarioId: string;
  startedAt: number;
  cash: number;
  holdings: Map<string, ScenarioPosition>;
  orders: ScenarioOrder[];
}

const runs = new Map<number, ScenarioRun>();

function simDaysPerSecond(scenario: Scenario): number {
  return scenario.durationDays / PLAYBACK_SECONDS;
}

export function currentSimDay(run: ScenarioRun, scenario: Scenario): number {
  const elapsedSec = (Date.now() - run.startedAt) / 1000;
  return Math.min(scenario.durationDays, elapsedSec * simDaysPerSecond(scenario));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return h / 1000;
}

function tickerBeta(volatility: number): number {
  return Math.min(2.0, Math.max(0.6, 0.6 + volatility * 8));
}

function idiosyncraticFactor(symbol: string, simDay: number): number {
  const seed = hashStr(symbol);
  const f1 = Math.sin(simDay * 0.13 + seed * 12.7) * 0.02;
  const f2 = Math.sin(simDay * 0.041 + seed * 27.1) * 0.035;
  return 1 + f1 + f2;
}

export function priceForSymbolAt(symbol: string, startPrice: number, volatility: number, scenario: Scenario, simDay: number): number {
  const indexRatio = indexLevelAt(scenario, simDay) / scenario.points[0].level;
  const beta = tickerBeta(volatility);
  const deviation = (indexRatio - 1) * beta;
  const price = startPrice * (1 + deviation) * idiosyncraticFactor(symbol, simDay);
  return Math.max(0.5, Math.round(price * 100) / 100);
}

export function startScenario(userId: number, scenarioId: string): Scenario {
  const scenario = getScenario(scenarioId);
  if (!scenario) throw new Error("UNKNOWN_SCENARIO");
  runs.set(userId, {
    scenarioId,
    startedAt: Date.now(),
    cash: START_CASH,
    holdings: new Map(),
    orders: [],
  });
  return scenario;
}

export function stopScenario(userId: number): void {
  runs.delete(userId);
}

export function getRun(userId: number): ScenarioRun | undefined {
  return runs.get(userId);
}

export function getActiveScenario(userId: number): { run: ScenarioRun; scenario: Scenario } | undefined {
  const run = runs.get(userId);
  if (!run) return undefined;
  const scenario = getScenario(run.scenarioId);
  if (!scenario) return undefined;
  return { run, scenario };
}

export function getPrices(scenario: Scenario, simDay: number): { symbol: string; name: string; price: number }[] {
  return marketEngine.getTickers().map((t) => ({
    symbol: t.symbol,
    name: t.name,
    price: priceForSymbolAt(t.symbol, t.startPrice, t.volatility, scenario, simDay),
  }));
}

export function revealedEvents(scenario: Scenario, simDay: number): ScenarioEvent[] {
  return scenario.events.filter((e) => e.day <= simDay);
}

export function getScenarioPortfolio(run: ScenarioRun, scenario: Scenario, simDay: number) {
  const prices = new Map(getPrices(scenario, simDay).map((p) => [p.symbol, p.price]));
  const positions = [...run.holdings.entries()].map(([symbol, h]) => {
    const price = prices.get(symbol) ?? h.avgCost;
    const marketValue = Math.round(price * h.quantity * 100) / 100;
    const costBasis = Math.round(h.avgCost * h.quantity * 100) / 100;
    return {
      symbol,
      quantity: h.quantity,
      avgCost: h.avgCost,
      price,
      marketValue,
      costBasis,
      unrealizedPnl: Math.round((marketValue - costBasis) * 100) / 100,
      unrealizedPnlPct: costBasis > 0 ? Math.round(((marketValue - costBasis) / costBasis) * 10000) / 100 : 0,
    };
  });
  const holdingsValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const netWorth = Math.round((run.cash + holdingsValue) * 100) / 100;
  return { cash: run.cash, holdingsValue: Math.round(holdingsValue * 100) / 100, netWorth, positions };
}

export function placeScenarioOrder(
  userId: number,
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number
): { price: number } {
  const active = getActiveScenario(userId);
  if (!active) throw new Error("NO_ACTIVE_SCENARIO");
  const { run, scenario } = active;

  const simDay = currentSimDay(run, scenario);
  const ticker = marketEngine.getTickers().find((t) => t.symbol === symbol);
  if (!ticker) throw new Error("UNKNOWN_SYMBOL");
  const price = priceForSymbolAt(symbol, ticker.startPrice, ticker.volatility, scenario, simDay);
  const total = Math.round(price * quantity * 100) / 100;

  const holding = run.holdings.get(symbol);

  if (side === "BUY") {
    if (run.cash < total) throw new Error("INSUFFICIENT_FUNDS");
    run.cash = Math.round((run.cash - total) * 100) / 100;
    if (holding) {
      const newQty = holding.quantity + quantity;
      const newAvgCost = (holding.avgCost * holding.quantity + total) / newQty;
      run.holdings.set(symbol, { quantity: newQty, avgCost: newAvgCost });
    } else {
      run.holdings.set(symbol, { quantity, avgCost: price });
    }
  } else {
    if (!holding || holding.quantity < quantity) throw new Error("INSUFFICIENT_SHARES");
    run.cash = Math.round((run.cash + total) * 100) / 100;
    const remaining = holding.quantity - quantity;
    if (remaining <= 1e-9) run.holdings.delete(symbol);
    else run.holdings.set(symbol, { quantity: remaining, avgCost: holding.avgCost });
  }

  run.orders.push({ symbol, side, quantity, price, total, simDay });
  return { price };
}
