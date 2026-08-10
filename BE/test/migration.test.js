const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(
  __dirname,
  '../prisma/migrations/20260810120000_add_vocabulary_examples/migration.sql',
);

test('vocabulary examples migration is safe when the column already exists', () => {
  const migration = fs.readFileSync(migrationPath, 'utf8');

  assert.match(
    migration,
    /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+"examples"/i,
  );
});
