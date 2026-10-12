import { useApp } from "@/context/AppContext";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ChartIcon } from "@/components/icons";
import { formatDuration } from "@/lib/helpers";

const DIRECTION_LABEL: Record<string, string> = {
  "bn-jp": "Bengali → Japanese",
  "jp-bn": "Japanese → Bengali",
  mixed: "Mixed",
};

export function ScoresPage() {
  const { progress, navigate } = useApp();
  const history = progress.examHistory;

  return (
    <div>
      <PageHeader title="Scores & Exam History" subtitle="A complete record of every exam you've taken." />

      {history.length === 0 ? (
        <EmptyState
          icon={<ChartIcon className="h-10 w-10 text-slate-300" />}
          title="No exams yet"
          subtitle="Your exam history and scores will appear here."
        />
      ) : (
        <div className="space-y-3">
          {history.map((exam) => (
            <Card key={exam.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {new Date(exam.date).toLocaleString()}
                  </p>
                  <Badge tone="indigo">{DIRECTION_LABEL[exam.direction]}</Badge>
                  {exam.mode === "memory" && <Badge tone="amber">Memory practice</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Lessons: {exam.lessons.length > 5 ? `${exam.lessons.length} lessons` : exam.lessons.join(", ")} · Time: {formatDuration(exam.durationSec)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {exam.correct}/{exam.total}
                </span>
                <Badge tone={exam.accuracy >= 80 ? "green" : exam.accuracy >= 50 ? "amber" : "red"}>{exam.accuracy}%</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <button onClick={() => navigate("examSetup")} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Start a new exam →
        </button>
      </div>
    </div>
  );
}
