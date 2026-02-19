-- CreateEnum
CREATE TYPE "RetroStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RetroColumn" AS ENUM ('WENT_WELL', 'TO_IMPROVE', 'ACTION_ITEM');

-- CreateTable
CREATE TABLE "retro_boards" (
    "id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "status" "RetroStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retro_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retro_cards" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "column" "RetroColumn" NOT NULL DEFAULT 'WENT_WELL',
    "content" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "converted_story_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retro_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "retro_boards_sprint_id_key" ON "retro_boards"("sprint_id");

-- CreateIndex
CREATE INDEX "retro_cards_board_id_column_idx" ON "retro_cards"("board_id", "column");

-- AddForeignKey
ALTER TABLE "retro_boards" ADD CONSTRAINT "retro_boards_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retro_cards" ADD CONSTRAINT "retro_cards_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "retro_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retro_cards" ADD CONSTRAINT "retro_cards_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
