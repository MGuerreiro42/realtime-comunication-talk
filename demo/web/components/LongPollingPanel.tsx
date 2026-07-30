"use client";

import { useLongPolling } from "@/hooks/useLongPolling";
import { Button } from "./Button";
import { PanelView } from "./PanelView";

export function LongPollingPanel({ onCountChange }: { onCountChange: (count: number) => void }) {
  const { started, dotState, status, reqCount, msgCount, latency, feed, start, stop, clear } =
    useLongPolling(onCountChange);

  return (
    <PanelView
      technique="longpoll"
      badgeLabel="HTTP"
      title="Long Polling"
      description={
        <>
          The client opens a request and the server only responds once there&apos;s new data. Then
          the client immediately repeats.
        </>
      }
      dotState={dotState}
      status={status}
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
