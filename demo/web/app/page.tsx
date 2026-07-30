"use client";

import { useState } from "react";
import { PollingPanel } from "@/components/PollingPanel";
import { LongPollingPanel } from "@/components/LongPollingPanel";
import { SsePanel } from "@/components/SsePanel";
import { WebSocketPanel } from "@/components/WebSocketPanel";
import { NetworkBars, type ConnectionCounts } from "@/components/NetworkBars";
import { ExplainerCards } from "@/components/ExplainerCards";

export default function Home() {
  const [counts, setCounts] = useState<ConnectionCounts>({
    polling: 0,
    longPoll: 0,
    sse: 0,
    ws: 0,
  });

  return (
    <>
      <header>
        <h1>Real-Time Communication</h1>
        <p>Visual comparison: Polling · Long Polling · SSE · WebSocket</p>
      </header>

      <div className="grid">
        <PollingPanel onCountChange={(polling) => setCounts((c) => ({ ...c, polling }))} />
        <LongPollingPanel onCountChange={(longPoll) => setCounts((c) => ({ ...c, longPoll }))} />
        <SsePanel onCountChange={(sse) => setCounts((c) => ({ ...c, sse }))} />
        <WebSocketPanel onCountChange={(ws) => setCounts((c) => ({ ...c, ws }))} />
      </div>

      <NetworkBars counts={counts} />
      <ExplainerCards />
    </>
  );
}
