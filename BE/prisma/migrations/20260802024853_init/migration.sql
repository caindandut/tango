-- CreateTable
CREATE TABLE "VocabularySet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "kanji" TEXT NOT NULL,
    "hiragana" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "setId" TEXT NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "shuffledOrder" INTEGER[],
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vocabulary_setId_idx" ON "Vocabulary"("setId");

-- CreateIndex
CREATE INDEX "StudySession_setId_idx" ON "StudySession"("setId");

-- CreateIndex
CREATE INDEX "StudyResult_sessionId_idx" ON "StudyResult"("sessionId");

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_setId_fkey" FOREIGN KEY ("setId") REFERENCES "VocabularySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_setId_fkey" FOREIGN KEY ("setId") REFERENCES "VocabularySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyResult" ADD CONSTRAINT "StudyResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyResult" ADD CONSTRAINT "StudyResult_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
