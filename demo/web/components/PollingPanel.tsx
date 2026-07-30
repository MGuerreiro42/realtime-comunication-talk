"use client";

import { useEffect, useRef, useState } from "react";
import { StatusRow, type DotState } from "./StatusDot";
import { MessageFeed, pushEntry, type FeedEntry } from "./MessageFeed";
import { apiUrl, errorMessage, formatTime, type PriceEvent } from "@/lib/types";

export function PollingPanel({
  onCountChange,
}: {
  onCountChange: (count: number) => void;
}) {
  const [started, setStarted] = useState(false);
  const [dotState, setDotState] = useState<DotState>("");
  const [status, setStatus] = useState("Stopped");
  const [reqCount, setReqCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [latency, setLatency] = useState("—");
  const [feed, setFeed] = useState<FeedEntry[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reqCountRef = useRef(0);
  const msgCountRef = useRef(0);
  const keyRef = useRef(0);

  async function doPoll() {
    const t0 = Date.now();
    reqCountRef.current += 1;
    setReqCount(reqCountRef.current);
    onCountChange(reqCountRef.current);

    try {
      const res = await fetch(apiUrl("/api/polling"));
      const data: PriceEvent = await res.json();
      const lat = Date.now() - t0;
      msgCountRef.current += 1;
      setMsgCount(msgCountRef.current);
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
              <span style={{ color: "#475569", fontSize: ".7rem" }}>({lat}ms)</span>
            </>
          ),
        })
      );
    } catch (e) {
      keyRef.current += 1;
      setFeed((f) =>
        pushEntry(f, {
          key: keyRef.current,
          content: <span className="error-text">Error: {errorMessage(e)}</span>,
        })
      );
    }
  }

  function start() {
    setStarted(true);
    setDotState("connected");
    setStatus("Active");
    timerRef.current = setInterval(doPoll, 2000);
    doPoll();
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setStarted(false);
    setDotState("disconnected");
    setStatus("Stopped");
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  return (
    <div className="panel polling">
      <div className="panel-header">
        <span className="badge">HTTP</span>
        <h2>Polling</h2>
        <p>
          The client makes periodic requests to the server.
          <br />
          Simple, but inefficient — generates traffic even without new data.
        </p>
      </div>
      <StatusRow state={dotState} label={status}>
        <span className="interval-label" style={{ marginLeft: "auto" }}>
          every 2s
        </span>
      </StatusRow>
      <div className="stats">
        <div className="stat">
          <strong>{reqCount}</strong>Requests
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
