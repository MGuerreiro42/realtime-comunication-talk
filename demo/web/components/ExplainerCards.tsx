import { TECHNIQUE_STYLES, type Technique } from "@/lib/techniqueStyles";

interface ExplainerItem {
  label: string;
  text: string;
}

interface ExplainerCardData {
  technique: Technique;
  title: string;
  items: ExplainerItem[];
}

const EXPLAINER_CARDS: ExplainerCardData[] = [
  {
    technique: "polling",
    title: "Polling",
    items: [
      { label: "How it works", text: "client calls GET every N seconds" },
      { label: "Connections", text: "1 new per tick" },
      { label: "Latency", text: "up to N seconds" },
      { label: "Overhead", text: "high — requests even without new data" },
      { label: "Use case", text: "simple dashboards, maximum compatibility" },
    ],
  },
  {
    technique: "longpoll",
    title: "Long Polling",
    items: [
      { label: "How it works", text: "client opens a request, server holds it until there's data" },
      { label: "Connections", text: "1 per event (reconnects automatically)" },
      { label: "Latency", text: "near zero — responds as soon as there's data" },
      { label: "Overhead", text: "medium — reconnects on every event" },
      { label: "Use case", text: "chat, notifications (pre-SSE/WS)" },
    ],
  },
  {
    technique: "sse",
    title: "Server-Sent Events",
    items: [
      { label: "How it works", text: "persistent HTTP stream, server → client" },
      { label: "Connections", text: "a single one (browser auto-reconnects)" },
      { label: "Latency", text: "near zero" },
      { label: "Overhead", text: "low — HTTP headers only once" },
      { label: "Use case", text: "live feeds, logs, push notifications" },
    ],
  },
  {
    technique: "websocket",
    title: "WebSocket",
    items: [
      { label: "How it works", text: "full-duplex TCP upgrade (ws://)" },
      { label: "Connections", text: "a single persistent one" },
      { label: "Latency", text: "minimal — binary frames" },
      { label: "Overhead", text: "very low after handshake" },
      { label: "Use case", text: "games, live collaboration, trading, chat" },
    ],
  },
];

function ExplainerCard({ title, titleClassName, items }: Omit<ExplainerCardData, "technique"> & { titleClassName: string }) {
  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-[10px] px-5 py-4">
      <h3 className={`text-[0.88rem] font-bold mb-2 ${titleClassName}`}>{title}</h3>
      <ul className="pl-[1.1rem] list-disc text-[0.78rem] text-[#94a3b8] leading-[1.7]">
        {items.map((item) => (
          <li key={item.label}>
            <strong className="text-[#cbd5e1]">{item.label}:</strong> {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExplainerCards() {
  return (
    <div className="max-w-[1400px] mx-auto mb-8 px-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
      {EXPLAINER_CARDS.map((card) => (
        <ExplainerCard
          key={card.technique}
          title={card.title}
          titleClassName={TECHNIQUE_STYLES[card.technique].titleText}
          items={card.items}
        />
      ))}
    </div>
  );
}
