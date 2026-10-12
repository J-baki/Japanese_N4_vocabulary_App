import type {
  AppConfigData,
  ExamRecord,
  MemoryData,
  ProgressData,
  QuizDirection,
  StreakData,
  ThemeMode,
} from "@/types";
import { emptyStreak, expireStreak, todayStr } from "@/lib/helpers";

/**
 * A web app cannot write into the PC's Documents folder on its own, so data lives in the browser
 * (localStorage) under the three names from the spec, and "Export Backup" saves a .json file the
 * user can keep in Documents\Voca\backups.
 */
export const STORAGE_KEYS = {
  allData: "Voca_all_data", // app configuration + preferences
  memory: "Voca_memory", // incorrect / skipped vocabulary with per-word history
  progress: "Voca_progress", // exam history, scores, streak, improvement, per-word stats
} as const;

const DATA_VERSION = 1;
/** Full answer lists are kept for the newest exams only, so localStorage never fills up. */
const KEEP_ANSWERS_FOR = 20;

// ---------- defaults ----------

function systemTheme(): ThemeMode {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export const defaultConfig = (): AppConfigData => ({
  version: DATA_VERSION,
  preferences: { theme: systemTheme(), lastDirection: "bn-jp" },
});
export const defaultMemory = (): MemoryData => ({ entries: {} });
export const defaultProgress = (): ProgressData => ({
  examHistory: [],
  lessonStats: {},
  vocabStats: {},
  streak: emptyStreak(),
});

// ---------- normalizers (tolerate older / hand-edited files) ----------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function normalizeConfig(raw: unknown): AppConfigData | null {
  if (!isObj(raw) || !isObj(raw.preferences)) return null;
  const d = defaultConfig();
  const p = raw.preferences;
  const theme: ThemeMode = p.theme === "dark" || p.theme === "light" ? p.theme : d.preferences.theme;
  const lastDirection: QuizDirection = p.lastDirection === "jp-bn" ? "jp-bn" : "bn-jp";
  return { version: DATA_VERSION, preferences: { theme, lastDirection } };
}

function normalizeMemory(raw: unknown): MemoryData | null {
  if (!isObj(raw) || !isObj(raw.entries)) return null;
  return { entries: raw.entries as MemoryData["entries"] };
}

function normalizeStreak(raw: unknown): StreakData {
  if (!isObj(raw)) return emptyStreak();
  const s: StreakData = { ...emptyStreak(), ...(raw as Partial<StreakData>) };
  if (!Array.isArray(s.activeDates)) s.activeDates = [];
  return expireStreak(s);
}

function normalizeProgress(raw: unknown): ProgressData | null {
  if (!isObj(raw) || !Array.isArray(raw.examHistory)) return null;
  return {
    examHistory: (raw.examHistory as ExamRecord[]).map((r) => ({ ...r, mode: r.mode ?? "normal", answers: r.answers ?? [] })),
    lessonStats: isObj(raw.lessonStats) ? (raw.lessonStats as ProgressData["lessonStats"]) : {},
    vocabStats: isObj(raw.vocabStats) ? (raw.vocabStats as ProgressData["vocabStats"]) : {},
    streak: normalizeStreak(raw.streak),
  };
}

// ---------- low-level read / write ----------

function read<T>(key: string, normalize: (raw: unknown) => T | null): T | null {
  let text: string | null = null;
  try {
    text = localStorage.getItem(key);
    if (text === null) return null;
    return normalize(JSON.parse(text));
  } catch {
    // Unreadable file: keep a copy instead of silently overwriting it with defaults.
    try {
      if (text) localStorage.setItem(`${key}__corrupt_backup`, text);
    } catch {
      /* storage full or blocked */
    }
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Voca: could not save ${key}`, err);
  }
}

export const loadConfig = () => read(STORAGE_KEYS.allData, normalizeConfig);
export const loadMemory = () => read(STORAGE_KEYS.memory, normalizeMemory);
export const loadProgress = () => read(STORAGE_KEYS.progress, normalizeProgress);

export const saveConfig = (c: AppConfigData) => write(STORAGE_KEYS.allData, c);
export const saveMemory = (m: MemoryData) => write(STORAGE_KEYS.memory, m);
export const saveProgress = (p: ProgressData) =>
  write(STORAGE_KEYS.progress, {
    ...p,
    examHistory: p.examHistory.map((r, i) => (i < KEEP_ANSWERS_FOR ? r : { ...r, answers: [] })),
  });

// ---------- theme ----------

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

// ---------- backup / restore / reset ----------

export function exportAllData(): void {
  const payload = {
    app: "Voca",
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    [STORAGE_KEYS.allData]: loadConfig() ?? defaultConfig(),
    [STORAGE_KEYS.memory]: loadMemory() ?? defaultMemory(),
    [STORAGE_KEYS.progress]: loadProgress() ?? defaultProgress(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Voca_backup_${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Returns false (and changes nothing) unless the file is a valid Voca backup. */
export function importAllData(json: string): boolean {
  try {
    const raw = JSON.parse(json);
    if (!isObj(raw)) return false;
    const config = normalizeConfig(raw[STORAGE_KEYS.allData]);
    const memory = normalizeMemory(raw[STORAGE_KEYS.memory]);
    const progress = normalizeProgress(raw[STORAGE_KEYS.progress]);
    if (!config || !memory || !progress) return false;
    saveConfig(config);
    saveMemory(memory);
    saveProgress(progress);
    return true;
  } catch {
    return false;
  }
}

export function resetAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
