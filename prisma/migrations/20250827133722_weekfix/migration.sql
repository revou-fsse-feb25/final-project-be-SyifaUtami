/*
  Warnings:

  - You are about to drop the column `progressData` on the `student_progress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."student_progress" DROP COLUMN "progressData",
ADD COLUMN     "week1Material" "public"."MaterialStatus" NOT NULL DEFAULT 'NOT_DONE',
ADD COLUMN     "week2Material" "public"."MaterialStatus" NOT NULL DEFAULT 'NOT_DONE',
ADD COLUMN     "week3Material" "public"."MaterialStatus" NOT NULL DEFAULT 'NOT_DONE',
ADD COLUMN     "week4Material" "public"."MaterialStatus" NOT NULL DEFAULT 'NOT_DONE';
