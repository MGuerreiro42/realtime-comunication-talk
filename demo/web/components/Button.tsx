import type { ComponentProps } from "react";

type Variant = "start" | "stop" | "clear" | "send";

const variantClasses: Record<Variant, string> = {
  start: "bg-[#22c55e] text-[#052e16]",
  stop: "bg-[#ef4444] text-white",
  clear: "bg-[#1e2535] text-[#94a3b8]",
  send: "bg-[#f59e0b] text-[#1c0a00]",
};

export function Button({
  variant,
  className = "",
  ...props
}: { variant: Variant } & ComponentProps<"button">) {
  return (
    <button
      className={`cursor-pointer rounded-md px-3 py-1.5 text-[0.78rem] font-semibold transition-[opacity,transform] duration-150 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
