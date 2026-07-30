"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Stat } from "./Stat";
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

  return (
    <div className="rounded-xl overflow-hidden flex flex-col bg-[#161b27] border border-[#1e2535] border-t-[3px] border-t-[#22c55e]">
      <div className="px-5 pt-4 pb-3 border-b border-[#1e2535]">
        <span className="inline-block text-[0.68rem] font-semibold tracking-[0.04em] px-[0.55rem] py-[0.2rem] rounded-full mb-1 bg-[#1a3a2a] text-[#4ade80]">
          SSE
        </span>
        <h2 className="text-[1.05rem] font-semibold">Server-Sent Events</h2>
        <p className="text-[0.78rem] text-[#64748b] mt-1 leading-[1.4]">
          A single persistent HTTP connection. The server sends events whenever it wants.
          Unidirectional (server → client).
        </p>
      </div>
      <StatusRow state={dotState} label={status} />
      <div className="flex gap-4 px-5 py-[0.6rem] border-b border-[#1e2535] text-[0.78rem] text-[#64748b]">
        <Stat value={started ? 1 : 0} label="Connections" />
        <Stat value={msgCount} label="Messages" />
        <Stat value={latency} label="Latency" />
      </div>
      <MessageFeed entries={feed} accentClassName="border-l-[#22c55e]" />
      <div className="px-5 py-3 border-t border-[#1e2535] flex gap-[0.6rem] flex-wrap items-center">
        <Button variant="start" onClick={start} disabled={started}>
          Start
        </Button>
        <Button variant="stop" onClick={stop} disabled={!started}>
          Stop
        </Button>
        <Button variant="clear" onClick={() => setFeed([])}>
          Clear
        </Button>
      </div>
    </div>
  );
}
