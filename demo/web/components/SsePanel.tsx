"use client";

import { useSse } from "@/hooks/useSse";
import { Button } from "./Button";
import { PanelView } from "./PanelView";

export function SsePanel({ onCountChange }: { onCountChange: (count: number) => void }) {
  const { started, dotState, status, msgCount, latency, feed, start, stop, clear } =
    useSse(onCountChange);

  return (
    <PanelView
      technique="sse"
      badgeLabel="SSE"
      title="Server-Sent Events"
      description={
        <>
          A single persistent HTTP connection. The server sends events whenever it wants.
          Unidirectional (server → client).
        </>
      }
      dotState={dotState}
      status={status}
      stats={[
        { value: started ? 1 : 0, label: "Connections" },
        { value: msgCount, label: "Messages" },
        { value: latency, label: "Latency" },
      ]}
      feed={feed}
      controls={
        <div className="px-5 py-3 border-t border-[#1e2535] flex gap-[0.6rem] flex-wrap items-center">
          <Button variant="start" onClick={start} disabled={started}>
            Start
          </Button>
          <Button variant="stop" onClick={stop} disabled={!started}>
            Stop
          </Button>
          <Button variant="clear" onClick={clear}>
            Clear
          </Button>
        </div>
      }
    />
  );
}
