"use client";

import { useWebSocketDemo } from "@/hooks/useWebSocketDemo";
import { Button } from "./Button";
import { PanelView } from "./PanelView";

export function WebSocketPanel({ onCountChange }: { onCountChange: (count: number) => void }) {
  const { started, dotState, status, msgCount, latency, feed, input, setInput, start, stop, send, clear } =
    useWebSocketDemo(onCountChange);

  return (
    <PanelView
      technique="websocket"
      badgeLabel="WS"
      title="WebSocket"
      description="Persistent full-duplex connection. Server and client can send messages at any time."
      dotState={dotState}
      status={status}
      stats={[
        { value: started ? 1 : 0, label: "Connections" },
        { value: msgCount, label: "Messages" },
        { value: latency, label: "Latency" },
      ]}
      feed={feed}
      controls={
        <>
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
            <Button variant="clear" onClick={clear}>
              Clear
            </Button>
          </div>
        </>
      }
    />
  );
}
