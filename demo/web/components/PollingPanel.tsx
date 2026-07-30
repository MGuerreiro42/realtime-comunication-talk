"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Stat } from "./Stat";
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

  return (
    <div className="rounded-xl overflow-hidden flex flex-col bg-[#161b27] border border-[#1e2535] border-t-[3px] border-t-[#3b82f6]">
      <div className="px-5 pt-4 pb-3 border-b border-[#1e2535]">
        <span className="inline-block text-[0.68rem] font-semibold tracking-[0.04em] px-[0.55rem] py-[0.2rem] rounded-full mb-1 bg-[#1e3a5f] text-[#60a5fa]">
          HTTP
        </span>
        <h2 className="text-[1.05rem] font-semibold">Polling</h2>
        <p className="text-[0.78rem] text-[#64748b] mt-1 leading-[1.4]">
          The client makes periodic requests to the server.
          <br />
          Simple, but inefficient — generates traffic even without new data.
        </p>
      </div>
      <StatusRow state={dotState} label={status}>
        <span className="text-[0.75rem] text-[#475569] ml-auto">every 2s</span>
      </StatusRow>
      <div className="flex gap-4 px-5 py-[0.6rem] border-b border-[#1e2535] text-[0.78rem] text-[#64748b]">
        <Stat value={reqCount} label="Requests" />
        <Stat value={msgCount} label="Messages" />
        <Stat value={latency} label="Latency" />
      </div>
      <MessageFeed entries={feed} accentClassName="border-l-[#3b82f6]" />
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
