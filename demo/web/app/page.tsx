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
      <header className="text-center pt-8 px-4 pb-6 border-b border-[#1e2535]">
        <h1 className="text-[1.8rem] font-bold text-[#f8fafc]">Real-Time Communication</h1>
        <p className="text-[#94a3b8] mt-1.5 text-[0.95rem]">
          Visual comparison: Polling · Long Polling · SSE · WebSocket
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 p-6 max-w-[1400px] mx-auto">
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
