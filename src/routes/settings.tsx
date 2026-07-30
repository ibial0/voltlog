import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/BottomNav";
import { useReadings, useSettings } from "@/hooks/useVoltLog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { requestNotificationPermission } from "@/lib/notifications";
import { addReading, clearReadings, DEFAULT_TARIFF, type Reading } from "@/lib/db";
import { toast } from "sonner";
import { useRef } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings \u00B7 VoltLog" },
      { name: "description", content: "Configure reminders, tariff, theme, and back up your VoltLog data." },
      { property: "og:title", content: "VoltLog Settings" },
      { property: "og:description", content: "Reminders, tariff, backup and preferences for VoltLog." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, update } = useSettings();
  const { readings, refresh } = useReadings();
  const fileRef = useRef<HTMLInputElement>(null);

  async function enableReminders(v: boolean) {
    if (v) {
      const p = await requestNotificationPermission();
      if (p !== "granted") {
        toast.error("Notification permission denied");
        return;
      }
    }
    update({ reminderEnabled: v });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ readings, settings }, null, 2)], {
      type: "application/json",
    });
    download(blob, `voltlog-${Date.now()}.json`);
  }

  function exportCsv() {
    const header = "id,value,takenAt,createdAt\n";
    const rows = readings
      .map(
        (r) =>
          `${r.id},${r.value},${new Date(r.takenAt).toISOString()},${new Date(r.createdAt).toISOString()}`,
      )
      .join("\n");
    download(new Blob([header + rows], { type: "text/csv" }), `voltlog-${Date.now()}.csv`);
  }

  async function importJson(file: File) {
    try {
      const data = JSON.parse(await file.text());
      const rs: Reading[] = data.readings || [];
      for (const r of rs) {
        await addReading({ value: r.value, takenAt: r.takenAt, createdAt: r.createdAt || Date.now() });
      }
      if (data.settings) update(data.settings);
      await refresh();
      toast.success(`Imported ${rs.length} readings`);
    } catch {
      toast.error("Invalid backup file");
    }
  }

  async function resetAll() {
    if (!confirm("Delete ALL readings? This cannot be undone.")) return;
    await clearReadings();
    await refresh();
    toast.success("All data cleared");
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Settings</h1>

      <Section title="Reminders">
        <Row label="Daily reminder">
          <Switch checked={settings.reminderEnabled} onCheckedChange={enableReminders} />
        </Row>
        <Row label="Reminder time">
          <Input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => update({ reminderTime: e.target.value })}
            className="w-32"
          />
        </Row>
        <Row label="Repeat every">
          <select
            value={settings.reminderInterval}
            onChange={(e) => update({ reminderInterval: Number(e.target.value) })}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value={0}>Off</option>
            <option value={2}>2 min</option>
            <option value={3}>3 min</option>
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
          </select>
        </Row>
      </Section>

      <Section title="Display">
        <Row label="12-hour time">
          <Switch checked={settings.hour12} onCheckedChange={(v) => update({ hour12: v })} />
        </Row>
        <Row label="Dark mode">
          <Switch
            checked={settings.darkMode}
            onCheckedChange={(v) => {
              update({ darkMode: v });
              document.documentElement.classList.toggle("dark", v);
            }}
          />
        </Row>
      </Section>

      <Section title="Tariff (BDT / kWh)">
        <p className="text-xs text-muted-foreground">
          Slab tariff applied cumulatively per month. Edit the top-of-slab kWh and rate.
        </p>
        <div className="space-y-2">
          {settings.tariff.map((slab, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                type="number"
                value={slab.upTo}
                onChange={(e) => {
                  const t = [...settings.tariff];
                  t[i] = { ...t[i], upTo: Number(e.target.value) };
                  update({ tariff: t });
                }}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">kWh @</span>
              <Input
                type="number"
                step="0.01"
                value={slab.rate}
                onChange={(e) => {
                  const t = [...settings.tariff];
                  t[i] = { ...t[i], rate: Number(e.target.value) };
                  update({ tariff: t });
                }}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">{settings.currency}</span>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update({ tariff: DEFAULT_TARIFF })}>
            Reset to Bangladesh default
          </Button>
        </div>
      </Section>

      <Section title="Backup">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportJson}>Export JSON</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Import JSON</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
          />
          <Button variant="destructive" size="sm" onClick={resetAll}>Reset all data</Button>
        </div>
      </Section>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="space-y-3 rounded-xl border bg-card p-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}