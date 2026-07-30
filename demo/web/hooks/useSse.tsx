"use client";

import { useEffect, useRef, useState } from "react";
import { pushEntry, type FeedEntry } from "@/components/MessageFeed";
import type { DotState } from "@/components/StatusDot";
import { apiUrl, formatTime, isStatusEvent, type ServerMessage } from "@/lib/types";

export function useSse(onCountChange: (count: number) => void) {
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
            content: <span className="text-[#4ade80]">SSE connection established</span>,
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
              <span className="text-[#475569] mr-2">{formatTime(data.timestamp)}</span>
              <span className="font-bold">{data.coin}</span>{" "}
              <span className="text-[#94a3b8]">${data.price}</span>{" "}
              <span className="text-[#475569] text-[0.7rem]">(~{lat}ms)</span>
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

  return {
    started,
    dotState,
    status,
    msgCount,
    latency,
    feed,
    start,
    stop,
    clear: () => setFeed([]),
  };
}
