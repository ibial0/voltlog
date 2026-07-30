import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/BottomNav";
import { AddReadingSheet } from "@/components/AddReadingSheet";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { useReadings, useReminderScheduler, useSettings } from "@/hooks/useVoltLog";
import { formatDuration, todayUsage } from "@/lib/stats";
import { formatTime, splitMeter } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoltLog \u00B7 Track. Understand. Save." },
      {
        name: "description",
        content:
          "VoltLog is a fast, offline electricity meter tracker. Log daily readings, watch your usage, estimate your bill.",
      },
      { property: "og:title", content: "VoltLog \u00B7 Track. Understand. Save." },
      {
        property: "og:description",
        content:
          "Log daily electricity readings, track usage and estimate your bill \u2014 offline, on your phone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { readings, refresh } = useReadings();
  const { settings } = useSettings();
  useReminderScheduler(settings, readings);
  const [open, setOpen] = useState(false);

  const last = readings[readings.length - 1];
  const today = todayUsage(readings);
  const meter = useMemo(() => splitMeter(last?.value ?? 0), [last]);
  const lastAgo = last ? formatDuration(Date.now() - last.takenAt) : "\u2014";

  return (
    <AppShell>
      <header className="mb-6 flex items-center gap-2">
        <Zap className="h-5 w-5" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">VoltLog</h1>
          <p className="text-xs text-muted-foreground">Track. Understand. Save.</p>
        </div>
      </header>

      <section className="rounded-2xl border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Current reading</p>
        <div className="mt-3 flex items-end justify-center gap-1">
          {meter.integer.split("").map((d, i) => (
            <span
              key={i}
              className="rounded-md bg-zinc-900 px-2 py-2 font-mono text-2xl font-semibold text-zinc-50 tabular-nums dark:bg-zinc-800"
            >
              {d}
            </span>
          ))}
          <span className="rounded-md bg-red-600 px-2 py-2 font-mono text-2xl font-semibold text-white tabular-nums">
            {meter.decimal}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">kWh</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Today's usage</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">
              {today.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kWh</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Last reading</div>
            <div className="mt-0.5 text-lg font-semibold">
              {last ? formatTime(last.takenAt, settings.hour12) : "\u2014"}
            </div>
            <div className="text-[10px] text-muted-foreground">{lastAgo} ago</div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Next reminder</span>
          <span className="tabular-nums">
            {settings.reminderEnabled ? settings.reminderTime : "Off"}
          </span>
        </div>
      </section>

      <Button
        size="lg"
        className="mt-6 h-14 w-full rounded-2xl text-base"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-5 w-5" />
        Add Reading
      </Button>

      <AddReadingSheet
        open={open}
        onOpenChange={setOpen}
        previous={last}
        onSaved={refresh}
        existingTimestamps={readings.map((r) => r.takenAt)}
      />
    </AppShell>
  );
}
