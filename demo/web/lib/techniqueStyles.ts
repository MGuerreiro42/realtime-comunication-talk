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
