import { db } from "../db/index.js";
import { marketEngine } from "../market/engine.js";
import { getPortfolio } from "../trading/portfolio.js";

export interface AdviceTip {
  id: string;
  severity: "warning" | "positive" | "info";
  title: string;
  message: string;
}

const severityRank: Record<AdviceTip["severity"], number> = { warning: 0, positive: 1, info: 2 };

export function generateAdvice(userId: number): AdviceTip[] {
  const orderCount = (
    db.prepare("SELECT COUNT(*) AS c FROM orders WHERE user_id = ?").get(userId) as { c: number }
  ).c;

  const portfolio = getPortfolio(userId);
  const { cash, netWorth, positions } = portfolio;
  const tips: AdviceTip[] = [];

  if (orderCount === 0) {
    tips.push({
      id: "welcome",
      severity: "info",
      title: "Place your first trade",
      message:
        "You haven't traded yet. Head to the Market tab, pick a ticker, and buy a small position to see how price moves affect your portfolio in real time.",
    });
    return tips;
  }

  if (positions.length === 0) {
    tips.push({
      id: "all-cash",
      severity: "info",
      title: "You're fully in cash",
      message:
        "All of your money is sitting uninvested. Cash doesn't lose value to market swings, but it also can't grow — consider putting some of it to work.",
    });
  }

  const volatilityBySymbol = new Map(marketEngine.getTickers().map((t) => [t.symbol, t.volatility]));

  for (const p of positions) {
    const share = netWorth > 0 ? p.marketValue / netWorth : 0;
    if (share >= 0.4) {
      tips.push({
        id: `concentration-${p.symbol}`,
        severity: "warning",
        title: `${p.symbol} is ${Math.round(share * 100)}% of your portfolio`,
        message:
          positions.length > 1
            ? `A single position making up this much of your net worth means one bad day for ${p.symbol} has an outsized effect on you. Spreading trades across more tickers reduces that risk.`
            : `You're fully concentrated in one stock. Diversifying across several tickers is one of the simplest ways to reduce risk without necessarily reducing expected return.`,
      });
    }

    if (p.unrealizedPnlPct <= -15) {
      tips.push({
        id: `loss-${p.symbol}`,
        severity: "warning",
        title: `${p.symbol} is down ${Math.abs(p.unrealizedPnlPct)}%`,
        message:
          "A common beginner mistake is averaging down without a plan, hoping a losing position 'comes back'. Before adding more, ask whether you'd buy this position fresh today at its current price.",
      });
    }

    if (p.unrealizedPnlPct >= 25) {
      tips.push({
        id: `gain-${p.symbol}`,
        severity: "positive",
        title: `${p.symbol} is up ${p.unrealizedPnlPct}%`,
        message:
          "Nice move — but a gain isn't real until you sell. It's worth deciding in advance what would make you take some profit, rather than deciding in the moment.",
      });
    }
  }

  if (positions.length > 0) {
    const cashShare = netWorth > 0 ? cash / netWorth : 0;
    if (cashShare >= 0.7) {
      tips.push({
        id: "idle-cash",
        severity: "info",
        title: "You're holding a lot of uninvested cash",
        message: `About ${Math.round(cashShare * 100)}% of your net worth is sitting in cash. That's not necessarily wrong — but if you're not actively saving it for something, it's worth deciding whether that's intentional.`,
      });
    }

    const weightedVol =
      positions.reduce((sum, p) => sum + (volatilityBySymbol.get(p.symbol) ?? 0) * p.marketValue, 0) /
      Math.max(1, positions.reduce((sum, p) => sum + p.marketValue, 0));
    if (weightedVol >= 0.03) {
      tips.push({
        id: "high-volatility",
        severity: "warning",
        title: "Your holdings are skewed toward volatile tickers",
        message:
          "Higher-volatility stocks can swing hard in both directions. That's fine if you understand the risk and size positions accordingly — just make sure the swings you're seeing aren't a surprise.",
      });
    }
  }

  if (positions.length >= 4) {
    tips.push({
      id: "well-diversified",
      severity: "positive",
      title: "You're spread across several positions",
      message: "Holding multiple tickers means no single company's bad news can sink your whole portfolio.",
    });
  }

  if (tips.length === 0) {
    tips.push({
      id: "general",
      severity: "info",
      title: "Diversification reduces risk",
      message:
        "Spreading investments across different assets means a decline in any one of them has less impact on your overall portfolio. It's one of the few reliable ways to reduce risk without giving up expected return.",
    });
  }

  return tips.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]).slice(0, 6);
}
