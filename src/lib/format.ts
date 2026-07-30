export function formatTime(ts: number, hour12: boolean) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(ts: number, hour12: boolean) {
  return `${formatDate(ts)} \u00B7 ${formatTime(ts, hour12)}`;
}

export function toLocalInputValue(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(v: string): number {
  return new Date(v).getTime();
}

export function splitMeter(value: number): { integer: string; decimal: string } {
  const rounded = Math.round(value * 10) / 10;
  const s = rounded.toFixed(1);
  const [i, d] = s.split(".");
  return { integer: i.padStart(5, "0"), decimal: d };
}