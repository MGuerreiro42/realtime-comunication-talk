import { Panel, type PanelProps } from "./Panel";
import { RequestBar } from "./RequestBar";
import { ExplainerCard } from "./ExplainerCard";

export function TechniqueSection({
  panelProps,
  count,
}: {
  panelProps: PanelProps;
  count: number;
}) {
  return (
    <div className="w-screen shrink-0 snap-start min-h-screen flex flex-col justify-center gap-4 px-6 py-10 md:w-auto md:shrink-0 md:min-h-0 md:justify-start md:px-0 md:py-0">
      <Panel {...panelProps} />
      <RequestBar technique={panelProps.technique} count={count} />
      <ExplainerCard technique={panelProps.technique} />
    </div>
  );
}
