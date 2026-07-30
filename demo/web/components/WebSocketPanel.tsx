"use client";

import { useEffect, useRef, useState } from "react";
import { StatusRow, type DotState } from "./StatusDot";
import { MessageFeed, pushEntry, type FeedEntry } from "./MessageFeed";
import { apiWsUrl, formatTime, isStatusEvent, type ServerMessage } from "@/lib/types";

export function WebSocketPanel({
  onCountChange,
}: {
  onCountChange: (count: number) => void;
}) {
  const [started, setStarted] = useState(false);
  const [dotState, setDotState] = useState<DotState>("");
  const [status, setStatus] = useState("Stopped");
  const [msgCount, setMsgCount] = useState(0);
  const [latency, setLatency] = useState("—");
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [input, setInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const wsT0Ref = useRef(0);
  const msgCountRef = useRef(0);
  const keyRef = useRef(0);

  function start() {
    setStarted(true);
    const ws = new WebSocket(apiWsUrl("/ws"));
    wsRef.current = ws;
    wsT0Ref.current = Date.now();
    setDotState("waiting");
    setStatus("Connecting...");
    onCountChange(1);

    ws.onopen = () => {
      setDotState("connected");
      setStatus("Connected");
    };

    ws.onmessage = (e) => {
      const data: ServerMessage = JSON.parse(e.data);
      msgCountRef.current += 1;
      setMsgCount(msgCountRef.current);

      if (isStatusEvent(data)) {
        if (data.type === "connected") {
          setLatency(`${Date.now() - wsT0Ref.current}ms`);
          keyRef.current += 1;
          setFeed((f) =>
            pushEntry(f, {
              key: keyRef.current,
              content: <span className="ws-text">{data.message}</span>,
            })
          );
        } else {
          keyRef.current += 1;
          setFeed((f) =>
            pushEntry(f, {
              key: keyRef.current,
              content: (
                <>
                  <span className="time">{formatTime(data.timestamp)}</span>
                  <span className="ws-text">{data.message}</span>
                  <span className="echo-tag">[echo]</span>
                </>
              ),
            })
          );
        }
        return;
      }

      const lat = Math.abs(Date.now() - new Date(data.timestamp).getTime());
      setLatency(`${lat}ms`);
      keyRef.current += 1;
      setFeed((f) =>
        pushEntry(f, {
          key: keyRef.current,
          content: (
            <>
              <span className="time">{formatTime(data.timestamp)}</span>
              <span className="coin">{data.coin}</span>{" "}
              <span className="price">${data.price}</span>{" "}
              <span style={{ color: "#475569", fontSize: ".7rem" }}>(~{lat}ms)</span>
            </>
          ),
        })
      );
    };

    ws.onclose = () => {
      setDotState("disconnected");
      setStatus("Disconnected");
    };
    ws.onerror = () => {
      setDotState("disconnected");
      setStatus("Error");
    };
  }

  function stop() {
    wsRef.current?.close();
    wsRef.current = null;
    setStarted(false);
    setDotState("disconnected");
    setStatus("Disconnected");
    onCountChange(0);
  }

  function send() {
    const msg = input.trim();
    if (!msg || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(msg);
    setInput("");
  }

  useEffect(
    () => () => {
      wsRef.current?.close();
    },
    []
  );

  return (
    <div className="panel websocket">
      <div className="panel-header">
        <span className="badge">WS</span>
        <h2>WebSocket</h2>
        <p>Persistent full-duplex connection. Server and client can send messages at any time.</p>
      </div>
      <StatusRow state={dotState} label={status} />
      <div className="stats">
        <div className="stat">
          <strong>{started ? 1 : 0}</strong>Connections
        </div>
        <div className="stat">
          <strong>{msgCount}</strong>Messages
        </div>
        <div className="stat">
          <strong>{latency}</strong>Latency
        </div>
      </div>
      <MessageFeed entries={feed} />
      <div className="controls">
        <div className="ws-send">
          <input
            type="text"
            placeholder="Send a message to the server..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button className="btn-send" onClick={send} disabled={!started}>
            Send
          </button>
        </div>
      </div>
      <div className="controls no-top-border">
        <button className="btn-start" onClick={start} disabled={started}>
          Connect
        </button>
        <button className="btn-stop" onClick={stop} disabled={!started}>
          Disconnect
        </button>
        <button className="btn-clear" onClick={() => setFeed([])}>
          Clear
        </button>
      </div>
    </div>
  );
}
