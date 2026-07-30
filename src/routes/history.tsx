import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/BottomNav";
import { AddReadingSheet } from "@/components/AddReadingSheet";
import { Button } from "@/components/ui/button";
import { deleteReading, type Reading } from "@/lib/db";
import { useReadings, useSettings } from "@/hooks/useVoltLog";
import { formatDateTime } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History \u00B7 VoltLog" },
      { name: "description", content: "Every electricity meter reading you've logged, editable and deletable." },
      { property: "og:title", content: "VoltLog History" },
      { property: "og:description", content: "Review, edit and clean up your past meter readings." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { readings, refresh } = useReadings();
  const { settings } = useSettings();
  const [editing, setEditing] = useState<Reading | undefined>();
  const [open, setOpen] = useState(false);

  const sorted = [...readings].sort((a, b) => b.takenAt - a.takenAt);

  async function remove(id: number) {
    if (!confirm("Delete this reading?")) return;
    await deleteReading(id);
    toast.success("Deleted");
    refresh();
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">History</h1>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No readings yet.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((r, i) => {
            const prev = sorted[i + 1];
            const diff = prev ? r.value - prev.value : 0;
            return (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border bg-card p-3"
              >
                <div>
                  <div className="font-mono text-lg tabular-nums">
                    {r.value.toFixed(1)} <span className="text-xs text-muted-foreground">kWh</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(r.takenAt, settings.hour12)}
                  </div>
                  {prev && (
                    <div className="text-xs text-muted-foreground">
                      +{diff.toFixed(1)} kWh since previous
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(r.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <AddReadingSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(undefined);
        }}
        editing={editing}
        onSaved={refresh}
        allowEditTime
        existingTimestamps={readings.map((r) => r.takenAt)}
      />
    </AppShell>
  );
}