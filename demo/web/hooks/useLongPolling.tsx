"use client";

import { useEffect, useRef, useState } from "react";
import { pushEntry, type FeedEntry } from "@/components/MessageFeed";
import type { DotState } from "@/components/StatusDot";
import { apiUrl, errorMessage, formatTime, isAbortError, type PriceEvent } from "@/lib/types";

export function useLongPolling(onCountChange: (count: number) => void) {
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
              <span className="text-[#475569] mr-2">{formatTime(data.timestamp)}</span>
              <span className="font-bold">{data.coin}</span>{" "}
              <span className="text-[#94a3b8]">${data.price}</span>{" "}
              <span className="text-[#475569] text-[0.7rem]">({lat}ms)</span>
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
            content: <span className="text-[#ef4444]">Error: {errorMessage(e)}</span>,
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

  return {
    started,
    dotState,
    status,
    reqCount,
    msgCount,
    latency,
    feed,
    start,
    stop,
    clear: () => setFeed([]),
  };
}
