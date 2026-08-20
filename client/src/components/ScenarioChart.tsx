import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  day: number;
  price: number;
}

export function ScenarioChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return <div className="chart-placeholder">Collecting price history…</div>;
  }

  const first = points[0].price;
  const last = points[points.length - 1].price;
  const up = last >= first;
  const color = up ? "#16a34a" : "#dc2626";
  const min = Math.min(...points.map((p) => p.price));
  const max = Math.max(...points.map((p) => p.price));
  const pad = (max - min) * 0.1 || 1;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="scenarioFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tickFormatter={(d) => `day ${Math.round(d as number)}`} hide />
        <YAxis domain={[min - pad, max + pad]} hide />
        <Tooltip
          labelFormatter={(d) => `Day ${Math.round(d as number)}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any) => [`$${Number(value).toFixed(2)}`, "Price"]) as any}
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" }}
        />
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#scenarioFill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
