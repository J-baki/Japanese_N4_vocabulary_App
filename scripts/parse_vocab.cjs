const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'raw_vocab.txt'), 'utf-8');
const lines = raw.split('\n');

const BENGALI_RE = /[\u0980-\u09FF]/;
const CJK_RE = /[\u4e00-\u9faf]/;

let currentLesson = 0;
const items = [];
let idCounter = 1;

function cleanEdgeSeparators(s) {
  return s.replace(/^[\s\-–—|\/:]+/, '').replace(/[\s\-–—|\/:]+$/, '').trim();
}

for (let rawLine of lines) {
  const line = rawLine.trim();
  if (!line) continue;
  const lessonMatch = line.match(/^@@LESSON\s+(\d+)/);
  if (lessonMatch) {
    currentLesson = parseInt(lessonMatch[1], 10);
    continue;
  }
  if (!BENGALI_RE.test(line)) continue; // skip lines without bengali meaning

  const idx = line.search(BENGALI_RE);
  let meaning = cleanEdgeSeparators(line.slice(idx));
  let front = cleanEdgeSeparators(line.slice(0, idx));

  // remove stray leading bullet chars just in case
  front = front.replace(/^[•·]\s*/, '');

  let reading = front;
  let kanji = '';

  // Try parentheses first (kanji) - but ignore fullwidth [ ] context brackets
  const parenMatch = front.match(/^(.*?)\(([^)]+)\)(.*)$/);
  if (parenMatch) {
    reading = cleanEdgeSeparators(parenMatch[1]);
    kanji = cleanEdgeSeparators(parenMatch[2]);
  } else {
    // split by separators / | — –  (not inside [])
    const parts = front.split(/\s*[\/|—–]\s*/).filter(Boolean);
    if (parts.length >= 2) {
      reading = cleanEdgeSeparators(parts[0]);
      const rest = cleanEdgeSeparators(parts.slice(1).join(' '));
      if (rest && rest !== reading && CJK_RE.test(rest)) {
        kanji = rest;
      } else if (rest && rest !== reading && !CJK_RE.test(reading)) {
        // keep as alt text only if meaningfully different and not pure duplicate
        kanji = '';
      }
    } else {
      reading = cleanEdgeSeparators(front);
    }
  }

  if (!reading) reading = front;
  if (kanji === reading) kanji = '';

  items.push({
    id: `l${currentLesson}-${idCounter++}`,
    lesson: currentLesson,
    reading,
    kanji: kanji || undefined,
    meaning,
  });
}

// Stats
const byLesson = {};
for (const it of items) {
  byLesson[it.lesson] = (byLesson[it.lesson] || 0) + 1;
}
console.error('Lesson counts:', JSON.stringify(byLesson, null, 2));
console.error('Total items:', items.length);

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'vocabulary.json'), JSON.stringify(items, null, 2), 'utf-8');
console.error('Wrote vocabulary.json');
