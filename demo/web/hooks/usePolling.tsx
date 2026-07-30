"use client";

import { useEffect, useRef, useState } from "react";
import { pushEntry, type FeedEntry } from "@/components/MessageFeed";
import type { DotState } from "@/components/StatusDot";
import { apiUrl, errorMessage, formatTime, type PriceEvent } from "@/lib/types";

export function usePolling(onCountChange: (count: number) => void) {
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
              <span className="text-[#475569] mr-2">{formatTime(data.timestamp)}</span>
              <span className="font-bold">{data.coin}</span>{" "}
              <span className="text-[#94a3b8]">${data.price}</span>{" "}
              <span className="text-[#475569] text-[0.7rem]">({lat}ms)</span>
            </>
          ),
        })
      );
    } catch (e) {
      keyRef.current += 1;
      setFeed((f) =>
        pushEntry(f, {
          key: keyRef.current,
          content: <span className="text-[#ef4444]">Error: {errorMessage(e)}</span>,
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
