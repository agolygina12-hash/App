import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, type PricePoint } from "../api/client";
import { useMarket } from "../context/MarketContext";

interface Props {
  symbol: string;
}

const MAX_POINTS = 200;

export function PriceChart({ symbol }: Props) {
  const [points, setPoints] = useState<PricePoint[]>([]);
  const { subscribe } = useMarket();

  useEffect(() => {
    let cancelled = false;
    setPoints([]);
    api.history(symbol).then((data) => {
      if (!cancelled) setPoints(data.slice(-MAX_POINTS));
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    return subscribe((point) => {
      if (point.symbol !== symbol) return;
      setPoints((prev) => {
        const next = [...prev, point];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });
    });
  }, [symbol, subscribe]);

  if (points.length === 0) {
    return <div className="chart-placeholder">Loading chart…</div>;
  }

  const first = points[0].price;
  const last = points[points.length - 1].price;
  const up = last >= first;
  const color = up ? "#16a34a" : "#dc2626";
  const min = Math.min(...points.map((p) => p.price));
  const max = Math.max(...points.map((p) => p.price));
  const pad = (max - min) * 0.1 || 1;

  return (
    <div className="price-chart">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="ts"
            tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            hide
          />
          <YAxis domain={[min - pad, max + pad]} hide />
          <Tooltip
            labelFormatter={(ts) => new Date(ts as number).toLocaleTimeString()}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any) => [`$${Number(value).toFixed(2)}`, "Price"]) as any}
            contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" }}
          />
          <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#priceFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
