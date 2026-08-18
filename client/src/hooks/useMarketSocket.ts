import { useEffect, useRef, useState } from "react";
import type { PricePoint } from "../api/client";

export function useMarketSocket() {
  const [prices, setPrices] = useState<Record<string, PricePoint>>({});
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Set<(point: PricePoint) => void>());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    let socket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let closedByEffect = false;

    function connect() {
      socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        if (!closedByEffect) reconnectTimer = setTimeout(connect, 2000);
      };
      socket.onerror = () => socket.close();

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "snapshot") {
          const next: Record<string, PricePoint> = {};
          for (const p of msg.data as PricePoint[]) next[p.symbol] = p;
          setPrices(next);
        } else if (msg.type === "tick") {
          const point = msg.data as PricePoint;
          setPrices((prev) => ({ ...prev, [point.symbol]: point }));
          for (const listener of listenersRef.current) listener(point);
        }
      };
    }

    connect();
    return () => {
      closedByEffect = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  function subscribe(listener: (point: PricePoint) => void) {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }

  return { prices, connected, subscribe };
}
