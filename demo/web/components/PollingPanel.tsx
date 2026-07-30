"use client";

import { usePolling } from "@/hooks/usePolling";
import { Button } from "./Button";
import { PanelView } from "./PanelView";

export function PollingPanel({ onCountChange }: { onCountChange: (count: number) => void }) {
  const { started, dotState, status, reqCount, msgCount, latency, feed, start, stop, clear } =
    usePolling(onCountChange);

  return (
    <PanelView
      technique="polling"
      badgeLabel="HTTP"
      title="Polling"
      description={
        <>
          The client makes periodic requests to the server.
          <br />
          Simple, but inefficient — generates traffic even without new data.
        </>
      }
      dotState={dotState}
      status={status}
      statusExtra={<span className="text-[0.75rem] text-[#475569] ml-auto">every 2s</span>}
      stats={[
        { value: reqCount, label: "Requests" },
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
