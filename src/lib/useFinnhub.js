import { useState, useEffect, useRef, useCallback } from "react";

const FINNHUB_WS_URL = "wss://ws.finnhub.io";
const SYMBOL = "TMC";

/**
 * Hook that connects to Finnhub's websocket for live price/volume data.
 * Falls back gracefully if no API key is provided or connection fails.
 *
 * @param {string} apiKey - Finnhub API key
 * @returns {{ price, volume, change, changePct, prevClose, connected, lastUpdate }}
 */
export default function useFinnhub(apiKey) {
  const [price, setPrice] = useState(null);
  const [volume, setVolume] = useState(null);
  const [prevClose, setPrevClose] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const wsRef = useRef(null);
  const volumeAccRef = useRef(0); // Accumulate trade volumes
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnects = 5;

  // Fetch previous close from REST API for change calculation
  useEffect(() => {
    if (!apiKey) return;

    fetch(`https://finnhub.io/api/v1/quote?symbol=${SYMBOL}&token=${apiKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pc) setPrevClose(data.pc);
        // Use current price from REST as initial value until websocket connects
        if (data.c) setPrice(data.c);
        if (data.dp != null) setLastUpdate(new Date());
      })
      .catch((err) => console.warn("Finnhub REST error:", err));
  }, [apiKey]);

  const connect = useCallback(() => {
    if (!apiKey || wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${FINNHUB_WS_URL}?token=${apiKey}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
      ws.send(JSON.stringify({ type: "subscribe", symbol: SYMBOL }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "trade" && data.data?.length > 0) {
        // Finnhub sends batches of trades
        const trades = data.data;
        const latestTrade = trades[trades.length - 1];

        setPrice(latestTrade.p);
        setLastUpdate(new Date(latestTrade.t));

        // Accumulate volume from trades
        const batchVolume = trades.reduce((sum, t) => sum + (t.v || 0), 0);
        volumeAccRef.current += batchVolume;
        setVolume(volumeAccRef.current);
      }
    };

    ws.onerror = () => {
      console.warn("Finnhub websocket error");
    };

    ws.onclose = () => {
      setConnected(false);

      // Auto-reconnect with backoff
      if (reconnectAttempts.current < maxReconnects) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
        reconnectAttempts.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };
  }, [apiKey]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Derived values
  const change = price != null && prevClose != null ? price - prevClose : null;
  const changePct = price != null && prevClose != null && prevClose !== 0
    ? ((price - prevClose) / prevClose) * 100
    : null;

  return {
    price,
    volume,
    change,
    changePct,
    prevClose,
    connected,
    lastUpdate,
  };
}
