import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "node:http";
import { authRouter } from "./routes/auth.js";
import { marketRouter } from "./routes/market.js";
import { tradingRouter } from "./routes/trading.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { adviceRouter } from "./routes/advice.js";
import { scenarioRouter } from "./routes/scenario.js";
import { marketEngine } from "./market/engine.js";
import { attachWebSocket } from "./ws/index.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/market", marketRouter);
app.use("/api/trading", tradingRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/advice", adviceRouter);
app.use("/api/scenario", scenarioRouter);

const server = http.createServer(app);
attachWebSocket(server);
marketEngine.start();

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
