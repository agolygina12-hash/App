import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import { marketEngine } from "../market/engine.js";

export function attachWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: WebSocket) => {
    socket.send(
      JSON.stringify({ type: "snapshot", data: marketEngine.getLatestAll() })
    );

    const unsubscribe = marketEngine.onTick((point) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "tick", data: point }));
      }
    });

    socket.on("close", unsubscribe);
    socket.on("error", unsubscribe);
  });

  return wss;
}
