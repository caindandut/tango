const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shouldMarkMigrationApplied } = require('../src/scripts/recoverVocabularyMigration');

const migrationPath = path.join(
  __dirname,
  '../prisma/migrations/20260810120000_add_vocabulary_examples/migration.sql',
);
const hanVietMigrationPath = path.join(
  __dirname,
  '../prisma/migrations/20260823170000_add_han_viet_meaning/migration.sql',
);
const renderConfigPath = path.join(__dirname, '../render.yaml');

test('vocabulary examples migration is safe when the column already exists', () => {
  const migration = fs.readFileSync(migrationPath, 'utf8');

  assert.match(
    migration,
    /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+"examples"/i,
  );
});

test('Han-Viet migration adds a safe defaulted column', () => {
  const migration = fs.readFileSync(hanVietMigrationPath, 'utf8');

  assert.match(
    migration,
    /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+\x22hanVietMeaning\x22\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+''/i,
  );
});

test('Render build stays independent of database availability', () => {
  const renderConfig = fs.readFileSync(renderConfigPath, 'utf8');

  const buildCommand = renderConfig
    .match(/buildCommand:\s*(.+)/)?.[1] || '';

  assert.match(buildCommand, /npm install/);
  assert.match(buildCommand, /prisma generate/);
  assert.doesNotMatch(buildCommand, /recoverVocabularyMigration/);
  assert.doesNotMatch(buildCommand, /prisma migrate deploy/);
});

test('migration recovery applies only when the existing column is present', () => {
  assert.equal(shouldMarkMigrationApplied({ columnExists: true, migration: null }), true);
  assert.equal(shouldMarkMigrationApplied({
    columnExists: true,
    migration: { finished_at: null, rolled_back_at: null },
  }), true);
  assert.equal(shouldMarkMigrationApplied({ columnExists: false, migration: null }), false);
  assert.equal(shouldMarkMigrationApplied({
    columnExists: true,
    migration: { finished_at: new Date(), rolled_back_at: null },
  }), false);
});
