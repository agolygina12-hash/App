import { createContext, useContext, type ReactNode } from "react";
import { useMarketSocket } from "../hooks/useMarketSocket";
import type { PricePoint } from "../api/client";

interface MarketContextValue {
  prices: Record<string, PricePoint>;
  connected: boolean;
  subscribe: (listener: (point: PricePoint) => void) => () => void;
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const value = useMarketSocket();
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
