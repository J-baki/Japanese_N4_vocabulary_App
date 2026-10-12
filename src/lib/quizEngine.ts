import type { QuizDirection, QuizQuestion, VocabItem } from "@/types";

/** correct-answer combination memory: "vocabId:direction" -> set of already-used wrong-option combos */
export type DistractorHistory = Map<string, Set<string>>;

// ---------- text helpers ----------

/** Japanese text is stored as "reading\nkanji" so the UI can show them on two lines. */
export function japaneseText(v: VocabItem): string {
  return v.kanji ? `${v.reading}\n${v.kanji}` : v.reading;
}

export function splitOptionText(text: string): { main: string; sub?: string } {
  const i = text.indexOf("\n");
  return i === -1 ? { main: text } : { main: text.slice(0, i), sub: text.slice(i + 1) };
}

const questionTextOf = (v: VocabItem, d: QuizDirection) => (d === "bn-jp" ? v.meaning : japaneseText(v));
const answerTextOf = (v: VocabItem, d: QuizDirection) => (d === "bn-jp" ? japaneseText(v) : v.meaning);

// ---------- randomness ----------

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Picks 3 candidates with different option text, or fewer if the list can't supply them. */
function sampleDistinct(candidates: VocabItem[], d: QuizDirection, k = 3): VocabItem[] {
  const picked: VocabItem[] = [];
  const texts = new Set<string>();
  const tried = new Set<number>();
  const maxTries = Math.min(candidates.length, k * 12);
  while (picked.length < k && tried.size < maxTries) {
    const idx = Math.floor(Math.random() * candidates.length);
    if (tried.has(idx)) continue;
    tried.add(idx);
    const c = candidates[idx];
    const t = answerTextOf(c, d);
    if (texts.has(t)) continue;
    texts.add(t);
    picked.push(c);
  }
  return picked;
}

const comboKey = (items: VocabItem[]) => items.map((i) => i.id).sort().join(",");

/**
 * Wrong options: taken from the selected pool first (topped up from the whole vocabulary when the
 * pool is too small), never a duplicate/ambiguous answer, and never the same trio twice for the
 * same question while unused trios remain.
 */
function pickDistractors(
  item: VocabItem,
  d: QuizDirection,
  pool: VocabItem[],
  allVocab: VocabItem[],
  history: DistractorHistory
): VocabItem[] {
  const correctText = answerTextOf(item, d);
  const valid = (c: VocabItem) =>
    c.id !== item.id && c.meaning !== item.meaning && c.reading !== item.reading && answerTextOf(c, d) !== correctText;

  const primary = pool.filter(valid);
  const primaryIds = new Set(primary.map((c) => c.id));
  const combined = primary.concat(allVocab.filter((c) => valid(c) && !primaryIds.has(c.id)));

  const key = `${item.id}:${d}`;
  const used = history.get(key) ?? new Set<string>();

  let chosen: VocabItem[] = [];
  const attempts: [VocabItem[], number][] = [
    [primary, primary.length >= 4 ? 15 : 0],
    [combined, 25],
  ];
  outer: for (const [source, tries] of attempts) {
    for (let t = 0; t < tries; t++) {
      const trio = sampleDistinct(source, d);
      if (trio.length < 3) continue;
      chosen = trio;
      if (!used.has(comboKey(trio))) break outer;
    }
  }
  if (chosen.length < 3) chosen = sampleDistinct(combined, d); // last resort (tiny data sets)

  if (chosen.length === 3) {
    used.add(comboKey(chosen));
    history.set(key, used);
  }
  return chosen;
}

/**
 * Position of the correct answer (0-3): weighted toward positions used least so far, never
 * three in a row in the same slot, and never a 3-step staircase (A,B,C / D,C,B).
 */
function pickPosition(recent: number[], counts: number[]): number {
  const n = recent.length;
  const allowed = [0, 1, 2, 3].filter((p) => {
    if (n >= 2 && recent[n - 1] === p && recent[n - 2] === p) return false;
    if (n >= 2) {
      const d1 = recent[n - 1] - recent[n - 2];
      if (Math.abs(d1) === 1 && p - recent[n - 1] === d1) return false;
    }
    return true;
  });
  const max = Math.max(...counts);
  const weights = allowed.map((p) => 1 + (max - counts[p]));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < allowed.length; i++) {
    r -= weights[i];
    if (r <= 0) return allowed[i];
  }
  return allowed[allowed.length - 1];
}

/** Identical words (same reading, kanji and meaning) that appear in several lessons are asked once. */
function dedupeWords(items: VocabItem[]): VocabItem[] {
  const seen = new Set<string>();
  return items.filter((v) => {
    const k = `${v.reading}|${v.kanji ?? ""}|${v.meaning}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function assignDirections(n: number, direction: QuizDirection | "mixed"): QuizDirection[] {
  if (direction !== "mixed") return Array<QuizDirection>(n).fill(direction);
  return shuffle(Array.from({ length: n }, (_, i): QuizDirection => (i % 2 === 0 ? "bn-jp" : "jp-bn")));
}

export function generateQuiz(
  pool: VocabItem[],
  allVocab: VocabItem[],
  direction: QuizDirection | "mixed",
  count: number,
  history: DistractorHistory
): QuizQuestion[] {
  const unique = dedupeWords(pool);
  const chosen = shuffle(unique).slice(0, Math.max(0, Math.min(count, unique.length)));
  const dirs = assignDirections(chosen.length, direction);

  const questions: QuizQuestion[] = [];
  const recent: number[] = [];
  const counts = [0, 0, 0, 0];

  chosen.forEach((item, i) => {
    const d = dirs[i];
    const wrong = pickDistractors(item, d, unique, allVocab, history);
    if (wrong.length < 3) return;

    const correctAnswer = answerTextOf(item, d);
    const pos = pickPosition(recent, counts);
    recent.push(pos);
    counts[pos] += 1;

    const options = shuffle(wrong.map((w) => answerTextOf(w, d)));
    options.splice(pos, 0, correctAnswer);

    questions.push({
      id: `q${questions.length + 1}-${item.id}-${d}`,
      vocabId: item.id,
      lesson: item.lesson,
      direction: d,
      questionText: questionTextOf(item, d),
      options,
      correctAnswer,
    });
  });
  return questions;
}
