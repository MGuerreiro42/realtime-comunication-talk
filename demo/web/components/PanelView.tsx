import type { ReactNode } from "react";
import { StatusRow, type DotState } from "./StatusDot";
import { Stat } from "./Stat";
import { MessageFeed, type FeedEntry } from "./MessageFeed";
import { TECHNIQUE_STYLES, type Technique } from "@/lib/techniqueStyles";

export interface PanelStat {
  value: string | number;
  label: string;
}

export function PanelView({
  technique,
  badgeLabel,
  title,
  description,
  dotState,
  status,
  statusExtra,
  stats,
  feed,
  controls,
}: {
  technique: Technique;
  badgeLabel: string;
  title: string;
  description: ReactNode;
  dotState: DotState;
  status: string;
  statusExtra?: ReactNode;
  stats: PanelStat[];
  feed: FeedEntry[];
  controls: ReactNode;
}) {
  const style = TECHNIQUE_STYLES[technique];

  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col bg-[#161b27] border border-[#1e2535] border-t-[3px] ${style.panelBorder}`}
    >
      <div className="px-5 pt-4 pb-3 border-b border-[#1e2535]">
        <span
          className={`inline-block text-[0.68rem] font-semibold tracking-[0.04em] px-[0.55rem] py-[0.2rem] rounded-full mb-1 ${style.badge}`}
        >
          {badgeLabel}
        </span>
        <h2 className="text-[1.05rem] font-semibold">{title}</h2>
        <p className="text-[0.78rem] text-[#64748b] mt-1 leading-[1.4]">{description}</p>
      </div>
      <StatusRow state={dotState} label={status}>
        {statusExtra}
      </StatusRow>
      <div className="flex gap-4 px-5 py-[0.6rem] border-b border-[#1e2535] text-[0.78rem] text-[#64748b]">
        {stats.map((s) => (
          <Stat key={s.label} value={s.value} label={s.label} />
        ))}
      </div>
      <MessageFeed entries={feed} accentClassName={style.feedAccent} />
      {controls}
    </div>
  );
}
