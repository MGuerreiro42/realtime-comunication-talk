import { EXPLAINER_ITEMS, PANEL_INFO, TECHNIQUE_STYLES, type Technique } from "@/lib/constants";

export function ExplainerCard({ technique }: { technique: Technique }) {
  const { title } = PANEL_INFO[technique];
  const items = EXPLAINER_ITEMS[technique];
  const titleClassName = TECHNIQUE_STYLES[technique].titleText;

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
