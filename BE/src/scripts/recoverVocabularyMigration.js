const { execFileSync } = require('node:child_process');
const { Pool } = require('pg');

const MIGRATION_NAME = '20260810120000_add_vocabulary_examples';

function shouldMarkMigrationApplied({ columnExists, migration }) {
  if (!columnExists) return false;
  if (!migration) return true;
  return !migration.finished_at && !migration.rolled_back_at;
}

async function recoverVocabularyMigration({ databaseUrl = process.env.DATABASE_URL } = {}) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const columnResult = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'Vocabulary'
           AND column_name = 'examples'
       ) AS "exists"`,
    );
    let migration = null;
    try {
      const migrationResult = await pool.query(
        `SELECT finished_at, rolled_back_at
         FROM "_prisma_migrations"
         WHERE migration_name = $1
         ORDER BY started_at DESC
         LIMIT 1`,
        [MIGRATION_NAME],
      );
      migration = migrationResult.rows[0] || null;
    } catch (error) {
      if (error.code !== '42P01') throw error;
    }

    const columnExists = Boolean(columnResult.rows[0]?.exists);
    if (!shouldMarkMigrationApplied({ columnExists, migration })) {
      return false;
    }

    const prismaCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execFileSync(
      prismaCommand,
      ['prisma', 'migrate', 'resolve', '--applied', MIGRATION_NAME],
      { stdio: 'inherit' },
    );
    return true;
  } finally {
    await pool.end();
  }
}

module.exports = { MIGRATION_NAME, recoverVocabularyMigration, shouldMarkMigrationApplied };

if (require.main === module) {
  recoverVocabularyMigration()
    .then((recovered) => {
      console.log(recovered
        ? `Marked ${MIGRATION_NAME} as applied because its column already exists.`
        : 'No failed vocabulary migration recovery was needed.');
    })
    .catch((error) => {
      console.error('Migration recovery error:', error);
      process.exitCode = 1;
    });
}
