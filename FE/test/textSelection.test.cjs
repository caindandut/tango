const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../src/index.css'), 'utf8');
const component = fs.readFileSync(path.join(__dirname, '../src/components/study/VocabularyExamples.jsx'), 'utf8');

test('vocabulary example sentence text remains selectable inside its trigger', () => {
  const triggerStyles = css.match(/\.study-page \.vocabulary-examples__trigger\s*\{[\s\S]*?\}/)?.[0] || '';

  assert.match(triggerStyles, /user-select:\s*text/);
  assert.match(triggerStyles, /-webkit-user-select:\s*text/);
});

test('mobile selection waits for the browser to finish updating the Selection', () => {
  assert.match(component, /setTimeout\(/);
  assert.match(component, /onTouchEnd=\{\(event\) => scheduleSelection\(/);
});
