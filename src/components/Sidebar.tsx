import React from "react";
import { useApp, type Page } from "@/context/AppContext";
import { cn } from "@/utils/cn";
import {
  BookIcon,
  BrainIcon,
  ChartIcon,
  ExamIcon,
  FlameIcon,
  HomeIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  TrendIcon,
} from "@/components/icons";

const NAV_ITEMS: { page: Page; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { page: "home", label: "Home", icon: HomeIcon },
  { page: "streak", label: "Streak", icon: FlameIcon },
  { page: "examSetup", label: "Exam Selection", icon: ExamIcon },
  { page: "memory", label: "Memory Review", icon: BrainIcon },
  { page: "lessons", label: "Lessons", icon: BookIcon },
  { page: "scores", label: "Scores", icon: ChartIcon },
  { page: "improvement", label: "Improvement Statistics", icon: TrendIcon },
  { page: "settings", label: "Settings", icon: SettingsIcon },
];

const GROUP_START: Partial<Record<Page, boolean>> = {};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { page, navigate, theme, toggleTheme } = useApp();

  const isActive = (p: Page) => {
    if (p === "examSetup") return ["examSetup", "examPlay", "examResult"].includes(page);
    if (p === "memory") return ["memory", "memoryLesson"].includes(page);
    if (p === "lessons") return ["lessons", "lessonDetail"].includes(page);
    return page === p;
  };

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 px-5 pt-6 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold">
          V
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Voca</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map(({ page: p, label, icon: Icon }) => (
          <React.Fragment key={p}>
            {GROUP_START[p] && <div className="my-2 border-t border-slate-100 dark:border-slate-800" />}
            <button
              onClick={() => {
                navigate(p);
                onNavigate?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(p)
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-3 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <SunIcon className="h-4 w-4" />
            Theme
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              theme === "dark" ? "bg-indigo-600" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow transition-transform",
                theme === "dark" ? "translate-x-5" : "translate-x-0.5"
              )}
            >
              {theme === "dark" ? <MoonIcon className="h-3 w-3 text-indigo-600" /> : <SunIcon className="h-3 w-3 text-amber-500" />}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
