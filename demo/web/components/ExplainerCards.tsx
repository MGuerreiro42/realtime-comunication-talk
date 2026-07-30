import { EXPLAINER_CARDS, TECHNIQUE_STYLES, type ExplainerCardData } from "@/lib/constants";

function ExplainerCard({
  title,
  titleClassName,
  items,
}: Omit<ExplainerCardData, "technique"> & { titleClassName: string }) {
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
