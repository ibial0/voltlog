import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getSettings,
  listReadings,
  saveSettings,
  type Reading,
  type Settings,
} from "@/lib/db";
import { scheduleReminders } from "@/lib/notifications";

export function useReadings() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const r = await listReadings();
    setReadings(r);
    setLoading(false);
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { readings, loading, refresh };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", !!s.darkMode);
      }
    });
  }, []);
  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);
  return { settings, loading, update };
}

export function useReminderScheduler(settings: Settings, readings: Reading[]) {
  useEffect(() => {
    scheduleReminders(settings, readings);
  }, [settings, readings]);
}