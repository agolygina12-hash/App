# PaperTrade

A real-time paper-trading simulator for learning how to trade stocks — no real money, no real market risk.

Every account starts with **$100,000** in simulated cash. Prices for a set of fictional tickers move in real time (a live random-walk price engine ticks every ~1.5s), and you place market orders to buy and sell. Track your portfolio's P&L, review your order history, and see how you rank against other traders on the leaderboard.

## How it works

- **Market data**: `server/src/market/` defines a `DataSource` interface with a `SimulatedDataSource` implementation (mean-reverting random walk, per-symbol volatility, occasional spikes). This keeps the simulator fully self-contained — no API keys needed. The interface is designed so a real market-data provider (e.g. Finnhub, Alpha Vantage) can be swapped in later without touching the trading engine or frontend.
- **Real-time updates**: the backend broadcasts price ticks over a WebSocket (`/ws`); the frontend keeps one shared connection and updates ticker prices and charts live.
- **Trading engine**: market orders execute at the current simulated price. Buys/sells update cash and a weighted-average-cost position, all inside a SQLite transaction.
- **Accounts**: username/password auth with JWTs; each user has their own cash balance, holdings, and order history in SQLite.

## Project structure

```
server/   Express + WebSocket + SQLite backend (TypeScript)
client/   React + Vite frontend (TypeScript)
```

## Running locally

### 1. Backend

```bash
cd server
npm install
npm run dev       # http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api` and `/ws` to the backend on port 4000, so just open `http://localhost:5173`.

### Production build

```bash
cd server && npm run build && npm start
cd client && npm run build   # outputs static files to client/dist
```

## Environment variables (server)

| Variable     | Default                    | Purpose                        |
| ------------ | --------------------------- | ------------------------------- |
| `PORT`       | `4000`                      | HTTP/WebSocket port              |
| `JWT_SECRET` | `dev-secret-change-me`      | Secret used to sign auth tokens — set a real one in production |

## Features

- Register / log in (JWT auth)
- Live-updating market list and price chart per ticker
- Buy / sell market orders against live simulated prices
- Portfolio view: cash, holdings, market value, unrealized P&L
- Order history
- Leaderboard ranked by net worth
