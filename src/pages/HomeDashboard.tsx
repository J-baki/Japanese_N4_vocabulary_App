import { useApp } from "@/context/AppContext";
import { Badge, Button, Card } from "@/components/ui";
import {
  BookIcon,
  BrainIcon,
  ChartIcon,
  ExamIcon,
  FlameIcon,
  TrendIcon,
} from "@/components/icons";
import { formatDuration } from "@/lib/helpers";
import { improvementList, lastExam, memoryCount, overallAccuracy, vocabularyLearnedCount } from "@/lib/derived";

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </Card>
  );
}

export function HomeDashboard() {
  const { progress, memory, navigate } = useApp();
  const accuracy = overallAccuracy(progress);
  const learned = vocabularyLearnedCount(progress);
  const memCount = memoryCount(memory);
  const recent = lastExam(progress);
  const improvements = improvementList(progress).slice(0, 4);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Home Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep going! You're doing great.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<FlameIcon className="h-5 w-5 text-orange-600" />}
          tone="bg-orange-100 dark:bg-orange-500/10"
          label="Current Streak"
          value={`${progress.streak.currentStreak} Days`}
        />
        <StatCard
          icon={<FlameIcon className="h-5 w-5 text-violet-600" />}
          tone="bg-violet-100 dark:bg-violet-500/10"
          label="Longest Streak"
          value={`${progress.streak.longestStreak} Days`}
        />
        <StatCard
          icon={<ChartIcon className="h-5 w-5 text-emerald-600" />}
          tone="bg-emerald-100 dark:bg-emerald-500/10"
          label="Overall Accuracy"
          value={`${accuracy}%`}
        />
        <StatCard
          icon={<BrainIcon className="h-5 w-5 text-blue-600" />}
          tone="bg-blue-100 dark:bg-blue-500/10"
          label="Memory Items"
          value={`${memCount}`}
          sub="Items"
        />
        <StatCard
          icon={<ExamIcon className="h-5 w-5 text-pink-600" />}
          tone="bg-pink-100 dark:bg-pink-500/10"
          label="Last Exam Score"
          value={recent ? `${recent.accuracy}%` : "—"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Recent Exam</h2>
            <button onClick={() => navigate("scores")} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              View All
            </button>
          </div>
          {recent ? (
            <div className="space-y-2 text-sm">
              <Row label="Lessons" value={recent.lessons.length > 3 ? `${recent.lessons.length} lessons` : recent.lessons.map((l) => `Lesson ${l}`).join(", ")} />
              <Row label="Score" value={`${recent.correct} / ${recent.total}`} />
              <Row label="Accuracy" value={`${recent.accuracy}%`} />
              <Row label="Time Taken" value={formatDuration(recent.durationSec)} />
              <Button className="mt-3 w-full" onClick={() => navigate("examSetup")}>
                Start New Exam
              </Button>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">No exams taken yet.</p>
              <Button onClick={() => navigate("examSetup")}>Start Your First Exam</Button>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Improvement Summary</h2>
            <button onClick={() => navigate("improvement")} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              View All
            </button>
          </div>
          {improvements.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Retake lessons to see your improvement over time.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th className="pb-2 font-medium">Lesson</th>
                    <th className="pb-2 font-medium">Previous</th>
                    <th className="pb-2 font-medium">Current</th>
                    <th className="pb-2 font-medium">Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  {improvements.map((s) => (
                    <tr key={s.lesson} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 font-medium text-slate-700 dark:text-slate-200">Lesson {s.lesson}</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">{s.previousScore}%</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">{s.lastScore}%</td>
                      <td className="py-2">
                        <Badge tone={s.improvement >= 0 ? "green" : "red"}>
                          {s.improvement >= 0 ? "+" : ""}
                          {s.improvement}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <QuickAction icon={<ExamIcon className="h-5 w-5" />} label="Start Exam" onClick={() => navigate("examSetup")} />
          <QuickAction icon={<BrainIcon className="h-5 w-5" />} label="Memory Review" onClick={() => navigate("memory")} />
          <QuickAction icon={<BookIcon className="h-5 w-5" />} label="View Lessons" onClick={() => navigate("lessons")} />
          <QuickAction icon={<FlameIcon className="h-5 w-5" />} label="Check Streak" onClick={() => navigate("streak")} />
          <QuickAction icon={<TrendIcon className="h-5 w-5" />} label="View Improvement" onClick={() => navigate("improvement")} />
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-400">Vocabulary Learned: {learned} words mastered so far</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
    >
      <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
      {label}
    </button>
  );
}
