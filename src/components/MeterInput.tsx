import { useEffect, useRef } from "react";

export function MeterInput({
  value,
  onChange,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const digits = value.replace(/\D/g, "").slice(0, 6);
  const padded = digits.padStart(6, "0");
  const intPart = padded.slice(0, 5);
  const decPart = padded.slice(5);

  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={digits}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="absolute inset-0 h-full w-full opacity-0"
        aria-label="Meter reading digits"
      />
      <div className="flex items-center justify-center gap-1.5 rounded-2xl border bg-card p-4 shadow-inner">
        {intPart.split("").map((d, i) => (
          <Digit key={i} d={d} color="black" />
        ))}
        <div className="mx-0.5 h-2 w-2 rounded-full bg-red-600" />
        <Digit d={decPart} color="red" />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Tap the meter and type your reading
      </p>
    </div>
  );
}

function Digit({ d, color }: { d: string; color: "black" | "red" }) {
  return (
    <div
      className={
        "flex h-14 w-9 items-center justify-center rounded-md font-mono text-2xl font-semibold tabular-nums shadow-sm sm:h-16 sm:w-10 sm:text-3xl " +
        (color === "red"
          ? "bg-red-600 text-white"
          : "bg-zinc-900 text-zinc-50 dark:bg-zinc-800")
      }
    >
      {d}
    </div>
  );
}