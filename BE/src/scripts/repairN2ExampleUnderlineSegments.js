const fs = require('node:fs');
const path = require('node:path');
const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');

const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => (u.parts || []).flatMap((p) => p.words || []));

const kana = /[ぁ-ゖァ-ヺー]/u;
const isKanaOnly = (value) => value && [...value].every((c) => kana.test(c));
const stripNotes = (value) => value
  .replace(/（[^）]*）/gu, '')
  .replace(/\([^)]*\)/gu, '')
  .trim();

function candidates(word) {
  const out = [];
  for (const raw of [word.kanji, word.hiragana]) {
    for (const value of String(raw || '').split(/[／/]/u)) {
      const clean = stripNotes(value);
      if (clean) out.push({ text: clean, reading: isKanaOnly(clean) ? '' : clean === word.kanji ? word.hiragana : '' });
    }
  }
  // Verb/adjective inflections retain the kanji stem and add kana.
  for (const value of String(word.kanji || '').split(/[／/]/u)) {
    const clean = stripNotes(value);
    if (!clean || isKanaOnly(clean)) continue;
    const stem = clean.replace(/[うくぐすつぬぶむるいきぎしちにびみ]$/u, '');
    if (stem.length >= 2) out.push({ text: stem, reading: '' , stem: true });
  }
  return out.sort((a, b) => b.text.length - a.text.length);
}

function locate(japanese, word) {
  for (const candidate of candidates(word)) {
    const at = japanese.indexOf(candidate.text);
    if (at < 0) continue;
    let end = at + candidate.text.length;
    // Include inflectional kana attached to a kanji stem (e.g. 飛び上がって).
    if (candidate.stem) while (end < japanese.length && kana.test(japanese[end])) end += 1;
    return { at, end, reading: candidate.reading || '' };
  }
  return null;
}

let repaired = 0;
const unresolved = [];
for (const word of words) {
  for (const example of word.examples || []) {
    if (!Array.isArray(example.segments) || example.segments.length !== 1) continue;
    const only = example.segments[0];
    if (!only || !only.isUnderlined || only.text !== example.japanese) continue;
    const hit = locate(example.japanese, word);
    if (!hit) {
      unresolved.push({ sourceNumber: word.sourceNumber, japanese: example.japanese });
      continue;
    }
    const before = example.japanese.slice(0, hit.at);
    const target = example.japanese.slice(hit.at, hit.end);
    const after = example.japanese.slice(hit.end);
    example.segments = [];
    if (before) example.segments.push({ text: before, reading: '', isUnderlined: false });
    example.segments.push({ text: target, reading: hit.reading, isUnderlined: true });
    if (after) example.segments.push({ text: after, reading: '', isUnderlined: false });
    repaired += 1;
  }
}

data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`repaired ${repaired} full-sentence example underlines; unresolved ${unresolved.length}`);
console.log(JSON.stringify(unresolved.slice(0, 50), null, 2));
