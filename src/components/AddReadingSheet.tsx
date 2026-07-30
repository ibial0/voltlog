import { useEffect, useState } from "react";
import { MeterInput } from "./MeterInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { addReading, updateReading, type Reading } from "@/lib/db";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/format";
import { toast } from "sonner";

export function AddReadingSheet({
  open,
  onOpenChange,
  previous,
  editing,
  onSaved,
  allowEditTime = false,
  existingTimestamps,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  previous?: Reading;
  editing?: Reading;
  onSaved: () => void;
  allowEditTime?: boolean;
  existingTimestamps?: number[];
}) {
  const [digits, setDigits] = useState("");
  const [takenAt, setTakenAt] = useState<number>(Date.now());
  const [showTime, setShowTime] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDigits(String(Math.round(editing.value * 10)));
      setTakenAt(editing.takenAt);
      setShowTime(true);
    } else {
      setDigits("");
      setTakenAt(Date.now());
      setShowTime(false);
    }
  }, [open, editing]);

  const value = digits ? Number(digits) / 10 : 0;

  async function save() {
    if (!digits) return toast.error("Enter a reading");
    if (value < 0) return toast.error("Reading cannot be negative");
    if (previous && !editing && value < previous.value) {
      const ok = confirm(
        `New reading (${value.toFixed(1)}) is lower than last (${previous.value.toFixed(1)}). Save anyway?`,
      );
      if (!ok) return;
    }
    if (existingTimestamps?.some((t) => t === takenAt && t !== editing?.takenAt)) {
      return toast.error("A reading with this timestamp already exists");
    }
    if (editing) {
      await updateReading({ ...editing, value, takenAt });
      toast.success("Reading updated");
    } else {
      await addReading({ value, takenAt, createdAt: Date.now() });
      toast.success("Reading saved");
    }
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit reading" : "Add reading"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <MeterInput value={digits} onChange={setDigits} />
          {previous && !editing && (
            <p className="text-center text-xs text-muted-foreground">
              Previous: <span className="tabular-nums">{previous.value.toFixed(1)}</span> kWh
            </p>
          )}
          {allowEditTime || showTime ? (
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Date &amp; time</span>
              <input
                type="datetime-local"
                value={toLocalInputValue(takenAt)}
                onChange={(e) => setTakenAt(fromLocalInputValue(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          ) : (
            <button
              type="button"
              onClick={() => setShowTime(true)}
              className="mx-auto block text-xs text-muted-foreground underline underline-offset-4"
            >
              Edit date &amp; time
            </button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save reading</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}