import type { ReactNode } from "react";

const MAX_MSGS = 30;

export interface FeedEntry {
  key: number;
  content: ReactNode;
}

export function pushEntry(entries: FeedEntry[], entry: FeedEntry): FeedEntry[] {
  return [entry, ...entries].slice(0, MAX_MSGS);
}

export function MessageFeed({ entries }: { entries: FeedEntry[] }) {
  return (
    <div className="feed">
      {entries.map((entry) => (
        <div key={entry.key} className="msg new">
          {entry.content}
        </div>
      ))}
    </div>
  );
}
