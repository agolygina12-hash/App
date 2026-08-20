export interface ScenarioPoint {
  day: number; // days elapsed since scenario start
  level: number; // index level, normalized so points[0].level === 1.0 at the historical peak
}

export interface ScenarioEvent {
  day: number;
  date: string;
  title: string;
}

export interface Scenario {
  id: string;
  name: string;
  dateRange: string;
  description: string;
  startDate: string; // ISO date the simulated calendar starts on
  durationDays: number;
  peakToTroughPct: number;
  points: ScenarioPoint[];
  events: ScenarioEvent[];
}

// Index trajectories are approximate real S&P 500 shapes (normalized to 1.0 at the
// scenario's starting peak), built from well-documented peak/trough dates and values.
// They are illustrative of the real crisis shape, not tick-accurate historical data.
export const SCENARIOS: Scenario[] = [
  {
    id: "housing2008",
    name: "2008 Housing & Financial Crisis",
    dateRange: "Oct 2007 – Apr 2009",
    description:
      "The subprime mortgage collapse triggered a global banking crisis. The S&P 500 fell 57% over 17 months, the worst US bear market since the Great Depression.",
    startDate: "2007-10-09",
    durationDays: 560,
    peakToTroughPct: -57,
    points: [
      { day: 0, level: 1.0 },
      { day: 60, level: 0.955 },
      { day: 150, level: 0.9 },
      { day: 240, level: 0.87 },
      { day: 300, level: 0.82 },
      { day: 340, level: 0.8 },
      { day: 354, level: 0.71 },
      { day: 372, level: 0.62 },
      { day: 410, level: 0.48 },
      { day: 430, level: 0.577 },
      { day: 470, level: 0.52 },
      { day: 500, level: 0.47 },
      { day: 517, level: 0.4324 },
      { day: 540, level: 0.5 },
      { day: 560, level: 0.525 },
    ],
    events: [
      { day: 0, date: "Oct 9, 2007", title: "S&P 500 closes at a record high of 1,565" },
      { day: 160, date: "Mar 2008", title: "Bear Stearns collapses, sold to JPMorgan in a Fed-backed rescue" },
      { day: 335, date: "Sep 7, 2008", title: "Fannie Mae and Freddie Mac placed into government conservatorship" },
      { day: 341, date: "Sep 15, 2008", title: "Lehman Brothers files the largest bankruptcy in US history" },
      { day: 354, date: "Sep 29, 2008", title: "Congress rejects the bank bailout bill; markets post their worst point drop ever at the time" },
      { day: 410, date: "Nov 2008", title: "Citigroup is bailed out as unemployment climbs sharply" },
      { day: 517, date: "Mar 9, 2009", title: "S&P 500 bottoms at 676.53 — down 57% from the 2007 peak" },
    ],
  },
  {
    id: "dotcom2000",
    name: "Dot-Com Bubble Burst",
    dateRange: "Mar 2000 – Oct 2002",
    description:
      "Wildly overvalued internet stocks collapsed over two and a half grinding years, worsened by a recession, 9/11, and corporate accounting scandals.",
    startDate: "2000-03-24",
    durationDays: 930,
    peakToTroughPct: -49,
    points: [
      { day: 0, level: 1.0 },
      { day: 90, level: 0.95 },
      { day: 180, level: 0.91 },
      { day: 280, level: 0.87 },
      { day: 380, level: 0.78 },
      { day: 450, level: 0.82 },
      { day: 540, level: 0.72 },
      { day: 545, level: 0.63 },
      { day: 600, level: 0.73 },
      { day: 700, level: 0.76 },
      { day: 780, level: 0.65 },
      { day: 850, level: 0.567 },
      { day: 900, level: 0.58 },
      { day: 930, level: 0.508 },
    ],
    events: [
      { day: 0, date: "Mar 24, 2000", title: "S&P 500 closes at a then-record high" },
      { day: 380, date: "Mar 2001", title: "US officially enters recession as the tech bubble unwinds" },
      { day: 540, date: "Sep 11, 2001", title: "Terrorist attacks close US markets for four days" },
      { day: 780, date: "Jun 2002", title: "WorldCom accounting fraud revealed, deepening the selloff" },
      { day: 850, date: "Jul 23, 2002", title: "Sharp intraday selloff as confidence in corporate earnings collapses" },
      { day: 930, date: "Oct 9, 2002", title: "S&P 500 bottoms at 776.76 — down 49% from the 2000 peak" },
    ],
  },
  {
    id: "covid2020",
    name: "COVID-19 Crash",
    dateRange: "Feb 2020 – Mar 2020",
    description:
      "The fastest bear market in history: a 34% collapse in about five weeks as the world shut down, followed by an equally sharp recovery.",
    startDate: "2020-02-19",
    durationDays: 40,
    peakToTroughPct: -34,
    points: [
      { day: 0, level: 1.0 },
      { day: 10, level: 0.878 },
      { day: 15, level: 0.9 },
      { day: 20, level: 0.8 },
      { day: 23, level: 0.72 },
      { day: 24, level: 0.795 },
      { day: 27, level: 0.7 },
      { day: 32, level: 0.685 },
      { day: 33, level: 0.661 },
      { day: 40, level: 0.724 },
    ],
    events: [
      { day: 0, date: "Feb 19, 2020", title: "S&P 500 closes at a record high of 3,386" },
      { day: 9, date: "Feb 28, 2020", title: "Fastest 10% correction in market history as COVID-19 spreads globally" },
      { day: 20, date: "Mar 9, 2020", title: "Oil price war triggers 'Black Monday'; trading halted by circuit breaker" },
      { day: 23, date: "Mar 12, 2020", title: "Worst single-day drop since 1987; trading halted again" },
      { day: 27, date: "Mar 16, 2020", title: "Dow falls 12.9% in a single day" },
      { day: 33, date: "Mar 23, 2020", title: "S&P 500 bottoms at 2,237 — down 34% in just over a month" },
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function indexLevelAt(scenario: Scenario, simDay: number): number {
  const pts = scenario.points;
  if (simDay <= pts[0].day) return pts[0].level;
  for (let i = 1; i < pts.length; i++) {
    if (simDay <= pts[i].day) {
      const a = pts[i - 1];
      const b = pts[i];
      const frac = (simDay - a.day) / (b.day - a.day);
      return a.level + (b.level - a.level) * frac;
    }
  }
  return pts[pts.length - 1].level;
}
