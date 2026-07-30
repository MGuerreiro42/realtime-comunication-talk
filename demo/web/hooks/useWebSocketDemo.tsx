"use client";

import { useEffect, useRef, useState } from "react";
import { pushEntry, type FeedEntry } from "@/components/MessageFeed";
import type { DotState } from "@/components/StatusDot";
import { apiWsUrl, formatTime, isStatusEvent, type ServerMessage } from "@/lib/types";

export function useWebSocketDemo(onCountChange: (count: number) => void) {
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

  return {
    started,
    dotState,
    status,
    msgCount,
    latency,
    feed,
    input,
    setInput,
    start,
    stop,
    send,
    clear: () => setFeed([]),
  };
}
