export interface PriceEvent {
  id: number;
  coin: string;
  price: string;
  timestamp: string;
  method: string;
  timedOut?: boolean;
}

export interface StatusEvent {
  type: "connected" | "echo";
  message: string;
  timestamp: string;
  original?: string;
  method?: string;
}

export type ServerMessage = PriceEvent | StatusEvent;

export function isStatusEvent(msg: ServerMessage): msg is StatusEvent {
  return "type" in msg;
}

export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", { hour12: false });
}

export function apiWsUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  return base.replace(/^http/, "ws") + path;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}
