import type { Reading, TariffSlab } from "./db";

export type UsageBucket = { key: string; label: string; usage: number; start: number };

export function computeIntervals(readings: Reading[]) {
  const out: { from: Reading; to: Reading; usage: number; hours: number }[] = [];
  for (let i = 1; i < readings.length; i++) {
    const a = readings[i - 1];
    const b = readings[i];
    const usage = Math.max(0, b.value - a.value);
    const hours = (b.takenAt - a.takenAt) / 3_600_000;
    out.push({ from: a, to: b, usage, hours });
  }
  return out;
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function dailyUsage(readings: Reading[]): Map<string, number> {
  const map = new Map<string, number>();
  const intervals = computeIntervals(readings);
  for (const iv of intervals) {
    const totalMs = iv.to.takenAt - iv.from.takenAt;
    if (totalMs <= 0) continue;
    let cursor = iv.from.takenAt;
    while (cursor < iv.to.takenAt) {
      const d = new Date(cursor);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      const chunkEnd = Math.min(endOfDay, iv.to.takenAt);
      const portion = (chunkEnd - cursor) / totalMs;
      const k = dayKey(cursor);
      map.set(k, (map.get(k) || 0) + iv.usage * portion);
      cursor = chunkEnd;
    }
  }
  return map;
}

export function periodUsage(readings: Reading[], sinceMs: number): number {
  if (readings.length < 2) return 0;
  const daily = dailyUsage(readings);
  let sum = 0;
  for (const [k, v] of daily) {
    const [y, m, d] = k.split("-").map(Number);
    const ts = new Date(y, m - 1, d).getTime();
    if (ts >= sinceMs) sum += v;
  }
  return sum;
}

export function todayUsage(readings: Reading[]) {
  const d = new Date();
  return periodUsage(readings, new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
}
export function weekUsage(readings: Reading[]) {
  const d = new Date();
  return periodUsage(readings, new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()).getTime());
}
export function monthUsage(readings: Reading[]) {
  const d = new Date();
  return periodUsage(readings, new Date(d.getFullYear(), d.getMonth(), 1).getTime());
}
export function yearUsage(readings: Reading[]) {
  const d = new Date();
  return periodUsage(readings, new Date(d.getFullYear(), 0, 1).getTime());
}

export function averageDaily(readings: Reading[]): number {
  const daily = dailyUsage(readings);
  if (!daily.size) return 0;
  let sum = 0;
  for (const v of daily.values()) sum += v;
  return sum / daily.size;
}

export function highLowDay(readings: Reading[]) {
  const daily = dailyUsage(readings);
  let high: { key: string; usage: number } | undefined;
  let low: { key: string; usage: number } | undefined;
  for (const [k, v] of daily) {
    if (!high || v > high.usage) high = { key: k, usage: v };
    if (!low || v < low.usage) low = { key: k, usage: v };
  }
  return { high, low };
}

export function dailySeries(readings: Reading[], days = 14): UsageBucket[] {
  const map = dailyUsage(readings);
  const out: UsageBucket[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    out.push({
      key: k,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      usage: +(map.get(k) || 0).toFixed(2),
      start: d.getTime(),
    });
  }
  return out;
}

export function monthlySeries(readings: Reading[], months = 6): UsageBucket[] {
  const daily = dailyUsage(readings);
  const monthMap = new Map<string, number>();
  for (const [k, v] of daily) {
    const [y, m] = k.split("-");
    const mk = `${y}-${m}`;
    monthMap.set(mk, (monthMap.get(mk) || 0) + v);
  }
  const out: UsageBucket[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
    out.push({
      key: k,
      label: d.toLocaleString("en", { month: "short" }),
      usage: +(monthMap.get(k) || 0).toFixed(1),
      start: d.getTime(),
    });
  }
  return out;
}

export function formatDuration(ms: number) {
  if (ms <= 0) return "0m";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function estimateCost(kwh: number, tariff: TariffSlab[]): number {
  let remaining = kwh;
  let prev = 0;
  let cost = 0;
  for (const slab of tariff) {
    const bandSize = slab.upTo - prev;
    if (bandSize <= 0) continue;
    const use = Math.min(remaining, bandSize);
    cost += use * slab.rate;
    remaining -= use;
    prev = slab.upTo;
    if (remaining <= 0) break;
  }
  return cost;
}