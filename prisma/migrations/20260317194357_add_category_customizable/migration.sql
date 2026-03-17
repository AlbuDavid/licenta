-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "isCustomizable" BOOLEAN NOT NULL DEFAULT false;
