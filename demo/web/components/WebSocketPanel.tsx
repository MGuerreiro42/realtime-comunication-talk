"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Stat } from "./Stat";
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
              content: <span className="text-[#fbbf24]">{data.message}</span>,
            })
          );
        } else {
          keyRef.current += 1;
          setFeed((f) =>
            pushEntry(f, {
              key: keyRef.current,
              content: (
                <>
                  <span className="text-[#475569] mr-2">{formatTime(data.timestamp)}</span>
                  <span className="text-[#fbbf24]">{data.message}</span>
                  <span className="text-[#f59e0b] ml-1.5 text-[0.7rem]">[echo]</span>
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
              <span className="text-[#475569] mr-2">{formatTime(data.timestamp)}</span>
              <span className="font-bold">{data.coin}</span>{" "}
              <span className="text-[#94a3b8]">${data.price}</span>{" "}
              <span className="text-[#475569] text-[0.7rem]">(~{lat}ms)</span>
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
    <div className="rounded-xl overflow-hidden flex flex-col bg-[#161b27] border border-[#1e2535] border-t-[3px] border-t-[#f59e0b]">
      <div className="px-5 pt-4 pb-3 border-b border-[#1e2535]">
        <span className="inline-block text-[0.68rem] font-semibold tracking-[0.04em] px-[0.55rem] py-[0.2rem] rounded-full mb-1 bg-[#3b2a0e] text-[#fbbf24]">
          WS
        </span>
        <h2 className="text-[1.05rem] font-semibold">WebSocket</h2>
        <p className="text-[0.78rem] text-[#64748b] mt-1 leading-[1.4]">
          Persistent full-duplex connection. Server and client can send messages at any time.
        </p>
      </div>
      <StatusRow state={dotState} label={status} />
      <div className="flex gap-4 px-5 py-[0.6rem] border-b border-[#1e2535] text-[0.78rem] text-[#64748b]">
        <Stat value={started ? 1 : 0} label="Connections" />
        <Stat value={msgCount} label="Messages" />
        <Stat value={latency} label="Latency" />
      </div>
      <MessageFeed entries={feed} accentClassName="border-l-[#f59e0b]" />
      <div className="px-5 py-3 border-t border-[#1e2535] flex gap-[0.6rem] flex-wrap items-center">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Send a message to the server..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            className="flex-1 bg-[#1e2535] border border-[#334155] rounded-md px-[0.6rem] py-[0.3rem] text-[#e2e8f0] text-[0.78rem] outline-none focus:border-[#f59e0b]"
          />
          <Button variant="send" onClick={send} disabled={!started}>
            Send
          </Button>
        </div>
      </div>
      <div className="px-5 pb-3 flex gap-[0.6rem] flex-wrap items-center">
        <Button variant="start" onClick={start} disabled={started}>
          Connect
        </Button>
        <Button variant="stop" onClick={stop} disabled={!started}>
          Disconnect
        </Button>
        <Button variant="clear" onClick={() => setFeed([])}>
          Clear
        </Button>
      </div>
    </div>
  );
}
