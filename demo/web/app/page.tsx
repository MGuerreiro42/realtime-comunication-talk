"use client";

import { useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import { useLongPolling } from "@/hooks/useLongPolling";
import { useSse } from "@/hooks/useSse";
import { useWebSocketDemo } from "@/hooks/useWebSocketDemo";
import { Button } from "@/components/Button";
import { Panel, type PanelStat } from "@/components/Panel";
import { NetworkBars, type ConnectionCounts } from "@/components/NetworkBars";
import { ExplainerCards } from "@/components/ExplainerCards";
import { PANEL_INFO, type Technique } from "@/lib/constants";

function StandardControls({
  start,
  stop,
  clear,
  started,
  startLabel = "Start",
  stopLabel = "Stop",
  bordered = true,
}: {
  start: () => void;
  stop: () => void;
  clear: () => void;
  started: boolean;
  startLabel?: string;
  stopLabel?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`px-5 flex gap-[0.6rem] flex-wrap items-center ${
        bordered ? "py-3 border-t border-[#1e2535]" : "pb-3"
      }`}
    >
      <Button variant="start" onClick={start} disabled={started}>
        {startLabel}
      </Button>
      <Button variant="stop" onClick={stop} disabled={!started}>
        {stopLabel}
      </Button>
      <Button variant="clear" onClick={clear}>
        Clear
      </Button>
    </div>
  );
}

export default function Home() {
  const [counts, setCounts] = useState<ConnectionCounts>({
    polling: 0,
    longpoll: 0,
    sse: 0,
    websocket: 0,
  });

  const setCount = (technique: Technique) => (count: number) =>
    setCounts((c) => ({ ...c, [technique]: count }));

  const polling = usePolling(setCount("polling"));
  const longPolling = useLongPolling(setCount("longpoll"));
  const sse = useSse(setCount("sse"));
  const ws = useWebSocketDemo(setCount("websocket"));

  const panels: {
    technique: Technique;
    badgeLabel: string;
    title: string;
    description: string;
    dotState: (typeof polling)["dotState"];
    status: string;
    statusExtra?: React.ReactNode;
    stats: PanelStat[];
    feed: (typeof polling)["feed"];
    controls: React.ReactNode;
  }[] = [
    {
      technique: "polling",
      ...PANEL_INFO.polling,
      dotState: polling.dotState,
      status: polling.status,
      statusExtra: PANEL_INFO.polling.intervalLabel && (
        <span className="text-[0.75rem] text-[#475569] ml-auto">
          {PANEL_INFO.polling.intervalLabel}
        </span>
      ),
      stats: [
        { value: polling.reqCount, label: "Requests" },
        { value: polling.msgCount, label: "Messages" },
        { value: polling.latency, label: "Latency" },
      ],
      feed: polling.feed,
      controls: (
        <StandardControls
          start={polling.start}
          stop={polling.stop}
          clear={polling.clear}
          started={polling.started}
        />
      ),
    },
    {
      technique: "longpoll",
      ...PANEL_INFO.longpoll,
      dotState: longPolling.dotState,
      status: longPolling.status,
      stats: [
        { value: longPolling.reqCount, label: "Requests" },
        { value: longPolling.msgCount, label: "Messages" },
        { value: longPolling.latency, label: "Latency" },
      ],
      feed: longPolling.feed,
      controls: (
        <StandardControls
          start={longPolling.start}
          stop={longPolling.stop}
          clear={longPolling.clear}
          started={longPolling.started}
        />
      ),
    },
    {
      technique: "sse",
      ...PANEL_INFO.sse,
      dotState: sse.dotState,
      status: sse.status,
      stats: [
        { value: sse.started ? 1 : 0, label: "Connections" },
        { value: sse.msgCount, label: "Messages" },
        { value: sse.latency, label: "Latency" },
      ],
      feed: sse.feed,
      controls: (
        <StandardControls start={sse.start} stop={sse.stop} clear={sse.clear} started={sse.started} />
      ),
    },
    {
      technique: "websocket",
      ...PANEL_INFO.websocket,
      dotState: ws.dotState,
      status: ws.status,
      stats: [
        { value: ws.started ? 1 : 0, label: "Connections" },
        { value: ws.msgCount, label: "Messages" },
        { value: ws.latency, label: "Latency" },
      ],
      feed: ws.feed,
      controls: (
        <>
          <div className="px-5 py-3 border-t border-[#1e2535] flex gap-[0.6rem] flex-wrap items-center">
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                placeholder="Send a message to the server..."
                value={ws.input}
                onChange={(e) => ws.setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") ws.send();
                }}
                className="flex-1 bg-[#1e2535] border border-[#334155] rounded-md px-[0.6rem] py-[0.3rem] text-[#e2e8f0] text-[0.78rem] outline-none focus:border-[#f59e0b]"
              />
              <Button variant="send" onClick={ws.send} disabled={!ws.started}>
                Send
              </Button>
            </div>
          </div>
          <StandardControls
            start={ws.start}
            stop={ws.stop}
            clear={ws.clear}
            started={ws.started}
            startLabel="Connect"
            stopLabel="Disconnect"
            bordered={false}
          />
        </>
      ),
    },
  ];

  return (
    <>
      <header className="text-center pt-8 px-4 pb-6 border-b border-[#1e2535]">
        <h1 className="text-[1.8rem] font-bold text-[#f8fafc]">Real-Time Communication</h1>
        <p className="text-[#94a3b8] mt-1.5 text-[0.95rem]">
          Visual comparison: Polling · Long Polling · SSE · WebSocket
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 p-6 max-w-[1400px] mx-auto">
        {panels.map((p) => (
          <Panel key={p.technique} {...p} />
        ))}
      </div>

      <NetworkBars counts={counts} />
      <ExplainerCards />
    </>
  );
}
