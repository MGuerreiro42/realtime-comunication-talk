export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <strong className="block text-[#cbd5e1] text-[0.95rem] font-semibold">{value}</strong>
      {label}
    </div>
  );
}
