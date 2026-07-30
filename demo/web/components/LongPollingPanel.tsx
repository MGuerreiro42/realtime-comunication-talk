"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Stat } from "./Stat";
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

  return (
    <div className="rounded-xl overflow-hidden flex flex-col bg-[#161b27] border border-[#1e2535] border-t-[3px] border-t-[#a855f7]">
      <div className="px-5 pt-4 pb-3 border-b border-[#1e2535]">
        <span className="inline-block text-[0.68rem] font-semibold tracking-[0.04em] px-[0.55rem] py-[0.2rem] rounded-full mb-1 bg-[#3b1f5e] text-[#c084fc]">
          HTTP
        </span>
        <h2 className="text-[1.05rem] font-semibold">Long Polling</h2>
        <p className="text-[0.78rem] text-[#64748b] mt-1 leading-[1.4]">
          The client opens a request and the server only responds once there&apos;s new data.
          Then the client immediately repeats.
        </p>
      </div>
      <StatusRow state={dotState} label={status} />
      <div className="flex gap-4 px-5 py-[0.6rem] border-b border-[#1e2535] text-[0.78rem] text-[#64748b]">
        <Stat value={reqCount} label="Requests" />
        <Stat value={msgCount} label="Messages" />
        <Stat value={latency} label="Latency" />
      </div>
      <MessageFeed entries={feed} accentClassName="border-l-[#a855f7]" />
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
