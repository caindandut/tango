ALTER TABLE "VocabularySet"
ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "level" TEXT NOT NULL DEFAULT 'N3',
ADD COLUMN IF NOT EXISTS "unitNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "unitTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "partNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "partTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "rangeStart" INTEGER,
ADD COLUMN IF NOT EXISTS "rangeEnd" INTEGER,
ADD COLUMN IF NOT EXISTS "isSummary" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Vocabulary"
ADD COLUMN IF NOT EXISTS "sourceNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "relations" JSONB NOT NULL DEFAULT '[]';

CREATE UNIQUE INDEX IF NOT EXISTS "VocabularySet_code_key"
ON "VocabularySet"("code");

CREATE INDEX IF NOT EXISTS "VocabularySet_level_unitNumber_partNumber_idx"
ON "VocabularySet"("level", "unitNumber", "partNumber");

CREATE INDEX IF NOT EXISTS "Vocabulary_setId_sourceNumber_idx"
ON "Vocabulary"("setId", "sourceNumber");
