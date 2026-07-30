import type { Settings, Reading } from "./db";

let dailyTimer: number | null = null;
let repeatTimer: number | null = null;

function clearAll() {
  if (dailyTimer) clearTimeout(dailyTimer);
  if (repeatTimer) clearTimeout(repeatTimer);
  dailyTimer = null;
  repeatTimer = null;
}

function notify(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-512.png", tag: "voltlog-reminder" });
  } catch {}
}

function hasReadingToday(readings: Reading[]): boolean {
  const today = new Date();
  const s = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const e = s + 86_400_000;
  return readings.some((r) => r.takenAt >= s && r.takenAt < e);
}

function msUntilNext(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function scheduleReminders(settings: Settings, readings: Reading[]) {
  clearAll();
  if (typeof window === "undefined") return;
  if (!settings.reminderEnabled) return;

  const fire = () => {
    if (hasReadingToday(readings)) return;
    notify("VoltLog reminder", "Time to record today's electricity reading.");
    if (settings.reminderInterval > 0) {
      repeatTimer = window.setTimeout(fire, settings.reminderInterval * 60_000);
    }
  };

  dailyTimer = window.setTimeout(() => {
    fire();
    scheduleReminders(settings, readings);
  }, msUntilNext(settings.reminderTime));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}