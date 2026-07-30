export type Technique = "polling" | "longpoll" | "sse" | "websocket";

export const TECHNIQUES: Technique[] = ["polling", "longpoll", "sse", "websocket"];

export interface TechniqueStyle {
  panelBorder: string;
  badge: string;
  feedAccent: string;
  titleText: string;
  barFill: string;
}

export const TECHNIQUE_STYLES: Record<Technique, TechniqueStyle> = {
  polling: {
    panelBorder: "border-t-[#3b82f6]",
    badge: "bg-[#1e3a5f] text-[#60a5fa]",
    feedAccent: "border-l-[#3b82f6]",
    titleText: "text-[#60a5fa]",
    barFill: "bg-[#3b82f6]",
  },
  longpoll: {
    panelBorder: "border-t-[#a855f7]",
    badge: "bg-[#3b1f5e] text-[#c084fc]",
    feedAccent: "border-l-[#a855f7]",
    titleText: "text-[#c084fc]",
    barFill: "bg-[#a855f7]",
  },
  sse: {
    panelBorder: "border-t-[#22c55e]",
    badge: "bg-[#1a3a2a] text-[#4ade80]",
    feedAccent: "border-l-[#22c55e]",
    titleText: "text-[#4ade80]",
    barFill: "bg-[#22c55e]",
  },
  websocket: {
    panelBorder: "border-t-[#f59e0b]",
    badge: "bg-[#3b2a0e] text-[#fbbf24]",
    feedAccent: "border-l-[#f59e0b]",
    titleText: "text-[#fbbf24]",
    barFill: "bg-[#f59e0b]",
  },
};

export interface PanelInfo {
  badgeLabel: string;
  title: string;
  description: string;
  /** Small label shown at the end of the status row, e.g. Polling's "every 2s" */
  intervalLabel?: string;
}

export const PANEL_INFO: Record<Technique, PanelInfo> = {
  polling: {
    badgeLabel: "HTTP",
    title: "Polling",
    description:
      "The client makes periodic requests to the server. Simple, but inefficient — generates traffic even without new data.",
    intervalLabel: "every 2s",
  },
  longpoll: {
    badgeLabel: "HTTP",
    title: "Long Polling",
    description:
      "The client opens a request and the server only responds once there's new data. Then the client immediately repeats.",
  },
  sse: {
    badgeLabel: "SSE",
    title: "Server-Sent Events",
    description:
      "A single persistent HTTP connection. The server sends events whenever it wants. Unidirectional (server → client).",
  },
  websocket: {
    badgeLabel: "WS",
    title: "WebSocket",
    description: "Persistent full-duplex connection. Server and client can send messages at any time.",
  },
};

export interface ExplainerItem {
  label: string;
  text: string;
}

export interface ExplainerCardData {
  technique: Technique;
  title: string;
  items: ExplainerItem[];
}

export const EXPLAINER_CARDS: ExplainerCardData[] = [
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

export interface BarInfo {
  label: string;
  unit: "requests" | "connection";
}

export const NETWORK_BARS: Record<Technique, BarInfo> = {
  polling: { label: "Polling", unit: "requests" },
  longpoll: { label: "Long Polling", unit: "requests" },
  sse: { label: "SSE (1 connection)", unit: "connection" },
  websocket: { label: "WebSocket (1 connection)", unit: "connection" },
};

export type ConnectionCounts = Record<Technique, number>;
