const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(
  __dirname,
  '../prisma/migrations/20260830120000_add_n2_vocabulary_metadata/migration.sql',
);

test('N2 metadata migration is additive and safe for existing N3 data', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  for (const column of [
    'code', 'level', 'unitNumber', 'unitTitle', 'partNumber',
    'partTitle', 'rangeStart', 'rangeEnd', 'isSummary',
  ]) {
    assert.match(
      sql,
      new RegExp(`ADD\\s+COLUMN\\s+IF\\s+NOT\\s+EXISTS\\s+\\x22${column}\\x22`, 'i'),
    );
  }
  assert.match(sql, /ALTER\s+TABLE\s+\x22Vocabulary\x22[\s\S]*sourceNumber/i);
  assert.match(sql, /ALTER\s+TABLE\s+\x22Vocabulary\x22[\s\S]*relations/i);
  assert.match(sql, /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS[\s\S]*code/i);
  assert.doesNotMatch(sql, /DROP\s+(TABLE|COLUMN)/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM/i);
});
