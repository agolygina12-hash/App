const TOKEN_KEY = "stocksim_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ user: User }>("/auth/me"),
  tickers: () => request<Ticker[]>("/market/tickers"),
  history: (symbol: string) => request<PricePoint[]>(`/market/tickers/${symbol}/history`),
  portfolio: () => request<Portfolio>("/trading/portfolio"),
  orders: () => request<Order[]>("/trading/orders"),
  placeOrder: (symbol: string, side: "BUY" | "SELL", quantity: number) =>
    request<{ ok: true; price: number }>("/trading/orders", {
      method: "POST",
      body: JSON.stringify({ symbol, side, quantity }),
    }),
  leaderboard: () => request<LeaderboardEntry[]>("/leaderboard"),
};

export { ApiError };

export interface User {
  id: number;
  username: string;
  email: string;
  cash: number;
}

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
}

export interface PricePoint {
  symbol: string;
  price: number;
  ts: number;
}

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

export interface Order {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface LeaderboardEntry {
  username: string;
  netWorth: number;
  returnPct: number;
}
