import type { ReactNode } from "react";

const MAX_MSGS = 30;

export interface FeedEntry {
  key: number;
  content: ReactNode;
}

export function pushEntry(entries: FeedEntry[], entry: FeedEntry): FeedEntry[] {
  return [entry, ...entries].slice(0, MAX_MSGS);
}

export function MessageFeed({
  entries,
  accentClassName,
}: {
  entries: FeedEntry[];
  /** Tailwind border-l color class for this panel's technique, e.g. "border-l-[#3b82f6]" */
  accentClassName: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 max-h-60 flex flex-col gap-[0.3rem]">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className={`bg-[#1e2535] rounded-md px-[0.7rem] py-[0.4rem] text-[0.78rem] font-mono border-l-[3px] animate-slide-in ${accentClassName}`}
        >
          {entry.content}
        </div>
      ))}
    </div>
  );
}
