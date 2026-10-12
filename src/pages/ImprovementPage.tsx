import { useApp } from "@/context/AppContext";
import { Badge, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { formatDuration } from "@/lib/helpers";
import { TrendIcon } from "@/components/icons";

export function ImprovementPage() {
  const { progress, navigate } = useApp();
  const stats = Object.values(progress.lessonStats).sort((a, b) => a.lesson - b.lesson);

  return (
    <div>
      <PageHeader title="Improvement Statistics" subtitle="Compare your current performance with previous attempts, lesson by lesson." />

      {stats.length === 0 ? (
        <EmptyState
          icon={<TrendIcon className="h-10 w-10 text-slate-300" />}
          title="No exam data yet"
          subtitle="Complete a few exams to start tracking your improvement over time."
        />
      ) : (
        <div className="space-y-4">
          {stats.map((s) => {
            const improvement = s.lastScore - s.previousScore;
            return (
              <Card key={s.lesson}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Lesson {s.lesson}</p>
                    <Badge tone="indigo">{s.attempts} attempts</Badge>
                  </div>
                  {s.attempts > 1 && (
                    <Badge tone={improvement >= 0 ? "green" : "red"}>
                      Improvement: {improvement >= 0 ? "+" : ""}
                      {improvement}%
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Metric label="Previous Accuracy" value={s.attempts > 1 ? `${s.previousScore}%` : "—"} />
                  <Metric label="Current Accuracy" value={`${s.lastScore}%`} />
                  <Metric label="Best Score" value={`${s.bestScore}%`} />
                  <Metric label="Avg. Time" value={formatDuration(s.avgTimeSec)} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-lg bg-emerald-50 py-2 text-emerald-600 dark:bg-emerald-500/10">
                    Correct: {s.correct}
                  </div>
                  <div className="rounded-lg bg-rose-50 py-2 text-rose-600 dark:bg-rose-500/10">Incorrect: {s.incorrect}</div>
                  <div className="rounded-lg bg-amber-50 py-2 text-amber-600 dark:bg-amber-500/10">Skipped: {s.skipped}</div>
                </div>

                <div className="mt-3">
                  <ProgressBar value={s.lastScore} tone={s.lastScore >= 80 ? "green" : s.lastScore >= 50 ? "amber" : "red"} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-center">
        <button onClick={() => navigate("examSetup")} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Practice more lessons to improve your stats →
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
