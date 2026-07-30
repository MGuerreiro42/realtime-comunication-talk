"use client";

import { useEffect, useRef, useState } from "react";
import { StatusRow, type DotState } from "./StatusDot";
import { MessageFeed, pushEntry, type FeedEntry } from "./MessageFeed";
import { apiUrl, errorMessage, formatTime, isAbortError, type PriceEvent } from "@/lib/types";

export function LongPollingPanel({
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

  const activeRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const reqCountRef = useRef(0);
  const msgCountRef = useRef(0);
  const keyRef = useRef(0);

  async function doLongPoll() {
    if (!activeRef.current) return;
    const t0 = Date.now();
    reqCountRef.current += 1;
    setReqCount(reqCountRef.current);
    onCountChange(reqCountRef.current);
    setDotState("waiting");
    setStatus("Waiting for server...");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(apiUrl("/api/long-polling"), { signal: controller.signal });
      const data: PriceEvent = await res.json();
      const lat = Date.now() - t0;
      msgCountRef.current += 1;
      setMsgCount(msgCountRef.current);
      setLatency(`${lat}ms`);
      setDotState("connected");
      setStatus("Received — reconnecting...");
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
      if (activeRef.current) setTimeout(doLongPoll, 50);
    } catch (e) {
      if (!isAbortError(e)) {
        keyRef.current += 1;
        setFeed((f) =>
          pushEntry(f, {
            key: keyRef.current,
            content: <span className="error-text">Error: {errorMessage(e)}</span>,
          })
        );
        if (activeRef.current) setTimeout(doLongPoll, 2000);
      }
    }
  }

  function start() {
    activeRef.current = true;
    setStarted(true);
    setDotState("waiting");
    setStatus("Waiting for server...");
    doLongPoll();
  }

  function stop() {
    activeRef.current = false;
    abortRef.current?.abort();
    setStarted(false);
    setDotState("disconnected");
    setStatus("Stopped");
  }

  useEffect(
    () => () => {
      activeRef.current = false;
      abortRef.current?.abort();
    },
    []
  );

  return (
    <div className="panel long-poll">
      <div className="panel-header">
        <span className="badge">HTTP</span>
        <h2>Long Polling</h2>
        <p>
          The client opens a request and the server only responds once there&apos;s new data.
          Then the client immediately repeats.
        </p>
      </div>
      <StatusRow state={dotState} label={status} />
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
