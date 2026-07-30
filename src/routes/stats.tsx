import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/BottomNav";
import { useReadings, useSettings } from "@/hooks/useVoltLog";
import {
  averageDaily,
  dailySeries,
  estimateCost,
  highLowDay,
  monthlySeries,
  monthUsage,
  todayUsage,
  weekUsage,
  yearUsage,
} from "@/lib/stats";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistics \u00B7 VoltLog" },
      { name: "description", content: "Charts, averages and estimated cost from your electricity meter data." },
      { property: "og:title", content: "VoltLog Statistics" },
      { property: "og:description", content: "Understand your electricity usage with clear charts and cost estimates." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { readings } = useReadings();
  const { settings } = useSettings();

  const daily = dailySeries(readings, 14);
  const monthly = monthlySeries(readings, 6);
  const avg = averageDaily(readings);
  const { high, low } = highLowDay(readings);
  const monthKwh = monthUsage(readings);
  const cost = estimateCost(monthKwh, settings.tariff);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Statistics</h1>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Today" value={`${todayUsage(readings).toFixed(1)} kWh`} />
        <Stat label="This week" value={`${weekUsage(readings).toFixed(1)} kWh`} />
        <Stat label="This month" value={`${monthKwh.toFixed(1)} kWh`} />
        <Stat label="This year" value={`${yearUsage(readings).toFixed(0)} kWh`} />
        <Stat label="Avg / day" value={`${avg.toFixed(1)} kWh`} />
        <Stat label="Est. month cost" value={`${settings.currency}${cost.toFixed(0)}`} />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Daily usage (14d)</h2>
        <div className="h-56 rounded-xl border bg-card p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="usage" stroke="currentColor" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Monthly usage</h2>
        <div className="h-56 rounded-xl border bg-card p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="usage" fill="currentColor" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {(high || low) && (
        <section className="mt-6 space-y-2 text-sm">
          {high && (
            <div className="flex justify-between rounded-lg border bg-card p-3">
              <span className="text-muted-foreground">Highest day</span>
              <span className="tabular-nums">
                {high.key} \u00B7 {high.usage.toFixed(1)} kWh
              </span>
            </div>
          )}
          {low && (
            <div className="flex justify-between rounded-lg border bg-card p-3">
              <span className="text-muted-foreground">Lowest day</span>
              <span className="tabular-nums">
                {low.key} \u00B7 {low.usage.toFixed(1)} kWh
              </span>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}