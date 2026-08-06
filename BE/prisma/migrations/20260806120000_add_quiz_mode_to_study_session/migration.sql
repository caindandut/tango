ALTER TABLE "StudySession"
ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'reading',
ADD COLUMN "quizOptions" JSONB;
