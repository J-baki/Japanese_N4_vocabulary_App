import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Card, PageHeader } from "@/components/ui";
import { DownloadIcon, MoonIcon, SunIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { memoryCount } from "@/lib/derived";

export function SettingsPage() {
  const { theme, toggleTheme, exportData, importData, resetData, deleteAllMemory, memory } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmMemoryClear, setConfirmMemoryClear] = useState(false);

  function handleImportClick() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      setImportMsg(ok ? "Backup imported successfully!" : "Failed to import file. Please check the file format.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage your theme, data, and memory preferences." />

      <Card>
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Appearance</h2>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            {theme === "dark" ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Data & Backup</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Your vocabulary progress, memory, and settings are saved automatically in this browser
          (mirroring <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-700">Voca_all_data</code>,{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-700">Voca_memory</code> and{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-700">Voca_progress</code>). Export a backup
          file regularly and keep it in your <strong>Documents\Voca\backups</strong> folder so your progress is never lost.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportData}>
            <DownloadIcon className="h-4 w-4" /> Export Backup (.json)
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <UploadIcon className="h-4 w-4" /> Import Backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
        {importMsg && <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">{importMsg}</p>}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Memory Management</h2>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <p className="font-medium">{memoryCount(memory)} items stored</p>
            <p className="text-xs text-slate-400">Incorrect and skipped vocabulary are kept until you delete them.</p>
          </div>
          {!confirmMemoryClear ? (
            <Button variant="danger" size="sm" onClick={() => setConfirmMemoryClear(true)} disabled={memoryCount(memory) === 0}>
              <TrashIcon className="h-4 w-4" /> Delete All Memory
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteAllMemory();
                  setConfirmMemoryClear(false);
                }}
              >
                Confirm
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmMemoryClear(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="border-rose-200 dark:border-rose-500/30">
        <h2 className="mb-3 font-semibold text-rose-600 dark:text-rose-400">Danger Zone</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          This will permanently delete all app data — exam history, streaks, memory, and preferences. Export a backup first!
        </p>
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Reset All App Data
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => {
                resetData();
                setConfirmReset(false);
              }}
            >
              Yes, delete everything
            </Button>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
