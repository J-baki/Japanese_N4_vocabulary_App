import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Card, PageHeader } from "@/components/ui";
import { FlameIcon } from "@/components/icons";
import { todayStr } from "@/lib/helpers";

export function StreakPage() {
  const { progress, checkIn } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const { streak } = progress;
  const checkedInToday = streak.lastCheckIn === todayStr();

  function handleCheckIn() {
    const didCheckIn = checkIn();
    setMessage(didCheckIn ? "Streak updated! Come back tomorrow to keep it going." : "You already checked in today. Come back tomorrow!");
  }

  const last14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const str = todayStr(d);
    return { date: str, active: streak.activeDates.includes(str) };
  });

  return (
    <div>
      <PageHeader title="Streak Board" subtitle="Check in daily to build your learning streak." />

      <Card className="mb-6 flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg">
          <FlameIcon className="h-10 w-10" />
        </div>
        <div>
          <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{streak.currentStreak} Days</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Current Streak</p>
        </div>
        <Button size="lg" onClick={handleCheckIn} disabled={checkedInToday}>
          {checkedInToday ? "Checked in today ✓" : "Check In Today"}
        </Button>
        {message && <p className="text-sm text-indigo-600 dark:text-indigo-400">{message}</p>}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{streak.currentStreak}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Streak</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{streak.longestStreak}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Longest Streak</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{streak.totalActiveDays}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Active Days</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Last 14 Days</h2>
        <div className="grid grid-cols-7 gap-2 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
          {last14.map((d) => (
            <div
              key={d.date}
              title={d.date}
              className={`flex h-10 items-center justify-center rounded-lg text-xs font-semibold ${
                d.active
                  ? "bg-gradient-to-br from-orange-400 to-rose-500 text-white"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              }`}
            >
              {new Date(d.date + "T00:00:00").getDate()}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
