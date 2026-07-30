// IndexedDB wrapper for VoltLog readings + settings.

export type Reading = {
  id: number;
  value: number;
  takenAt: number;
  createdAt: number;
};

export type TariffSlab = { upTo: number; rate: number };

export type Settings = {
  reminderTime: string;
  reminderInterval: number;
  reminderEnabled: boolean;
  hour12: boolean;
  darkMode: boolean;
  tariff: TariffSlab[];
  currency: string;
};

const DB_NAME = "voltlog";
const DB_VERSION = 1;

let dbp: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("readings")) {
        const s = db.createObjectStore("readings", { keyPath: "id", autoIncrement: true });
        s.createIndex("takenAt", "takenAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function reqAsync<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function listReadings(): Promise<Reading[]> {
  const db = await openDb();
  const s = db.transaction("readings", "readonly").objectStore("readings");
  const all = await reqAsync<Reading[]>(s.getAll() as IDBRequest<Reading[]>);
  return [...all].sort((a, b) => a.takenAt - b.takenAt);
}

export async function addReading(r: Omit<Reading, "id">): Promise<number> {
  const db = await openDb();
  const s = db.transaction("readings", "readwrite").objectStore("readings");
  return reqAsync<number>(s.add(r) as IDBRequest<number>);
}

export async function updateReading(r: Reading): Promise<void> {
  const db = await openDb();
  const s = db.transaction("readings", "readwrite").objectStore("readings");
  await reqAsync(s.put(r));
}

export async function deleteReading(id: number): Promise<void> {
  const db = await openDb();
  const s = db.transaction("readings", "readwrite").objectStore("readings");
  await reqAsync(s.delete(id));
}

export async function clearReadings(): Promise<void> {
  const db = await openDb();
  const s = db.transaction("readings", "readwrite").objectStore("readings");
  await reqAsync(s.clear());
}

export const DEFAULT_TARIFF: TariffSlab[] = [
  { upTo: 75, rate: 4.63 },
  { upTo: 200, rate: 6.32 },
  { upTo: 300, rate: 6.62 },
  { upTo: 400, rate: 6.99 },
  { upTo: 600, rate: 10.96 },
  { upTo: 999999, rate: 12.63 },
];

export const DEFAULT_SETTINGS: Settings = {
  reminderTime: "21:00",
  reminderInterval: 0,
  reminderEnabled: false,
  hour12: true,
  darkMode: false,
  tariff: DEFAULT_TARIFF,
  currency: "\u09F3",
};

export async function getSettings(): Promise<Settings> {
  const db = await openDb();
  const s = db.transaction("settings", "readonly").objectStore("settings");
  const v = await reqAsync<Settings | undefined>(s.get("app") as IDBRequest<Settings | undefined>);
  return { ...DEFAULT_SETTINGS, ...(v || {}) };
}

export async function saveSettings(v: Settings): Promise<void> {
  const db = await openDb();
  const s = db.transaction("settings", "readwrite").objectStore("settings");
  await reqAsync(s.put(v, "app"));
}