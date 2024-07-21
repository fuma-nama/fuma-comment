/*
  Warnings:

  - You are about to drop the column `thread` on the `Comment` table. All the data in the column will be lost.
  - Made the column `page` on table `Comment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Rate" DROP CONSTRAINT "Rate_commentId_fkey";

-- AlterTable
ALTER TABLE "Comment"
ALTER COLUMN "page" TYPE varchar(256) USING (COALESCE("page", "default")),
ALTER COLUMN "page" SET DEFAULT "default",
ALTER COLUMN "page" SET NOT NULL;

-- CreateTable
CREATE TABLE "Role" (
    "userId" VARCHAR(256) NOT NULL,
    "name" TEXT NOT NULL,
    "canDelete" BOOLEAN NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
