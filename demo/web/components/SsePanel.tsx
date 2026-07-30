"use client";

import { useEffect, useRef, useState } from "react";
import { StatusRow, type DotState } from "./StatusDot";
import { MessageFeed, pushEntry, type FeedEntry } from "./MessageFeed";
import { apiUrl, formatTime, isStatusEvent, type ServerMessage } from "@/lib/types";

export function SsePanel({
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

  const sourceRef = useRef<EventSource | null>(null);
  const msgCountRef = useRef(0);
  const keyRef = useRef(0);

  function start() {
    setStarted(true);
    const source = new EventSource(apiUrl("/api/sse"));
    sourceRef.current = source;
    setDotState("waiting");
    setStatus("Connecting...");
    onCountChange(1);

    source.onopen = () => {
      setDotState("connected");
      setStatus("Connected");
    };

    source.onmessage = (e) => {
      const data: ServerMessage = JSON.parse(e.data);
      if (isStatusEvent(data)) {
        keyRef.current += 1;
        setFeed((f) =>
          pushEntry(f, {
            key: keyRef.current,
            content: <span className="connected-text">SSE connection established</span>,
          })
        );
        return;
      }
      msgCountRef.current += 1;
      setMsgCount(msgCountRef.current);
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

    source.onerror = () => {
      setDotState("disconnected");
      setStatus("Error / Reconnecting...");
    };
  }

  function stop() {
    sourceRef.current?.close();
    sourceRef.current = null;
    setStarted(false);
    setDotState("disconnected");
    setStatus("Disconnected");
    onCountChange(0);
  }

  useEffect(
    () => () => {
      sourceRef.current?.close();
    },
    []
  );

  return (
    <div className="panel sse">
      <div className="panel-header">
        <span className="badge">SSE</span>
        <h2>Server-Sent Events</h2>
        <p>
          A single persistent HTTP connection. The server sends events whenever it wants.
          Unidirectional (server → client).
        </p>
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
        <button className="btn-start" onClick={start} disabled={started}>
          Start
        </button>
        <button className="btn-stop" onClick={stop} disabled={!started}>
          Stop
        </button>
        <button className="btn-clear" onClick={() => setFeed([])}>
          Clear
        </button>
      </div>
    </div>
  );
}
