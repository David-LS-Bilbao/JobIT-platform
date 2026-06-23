-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('INTERNAL', 'JOOBLE');

-- AlterEnum
ALTER TYPE "RemoteType" ADD VALUE 'UNSPECIFIED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "ingestedAt" TIMESTAMP(3),
ADD COLUMN     "source" "JobSource" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "Job_source_idx" ON "Job"("source");

-- CreateIndex: deduplicación de ofertas externas.
-- Índice único PARCIAL: solo aplica cuando "externalId" no es nulo, de modo que
-- varias filas INTERNAL con "externalId" = NULL pueden coexistir, mientras que
-- dos ofertas con el mismo ("source", "externalId") quedan bloqueadas.
-- Se escribe a mano porque Prisma no expresa índices únicos parciales en el schema.
CREATE UNIQUE INDEX "Job_source_externalId_key" ON "Job"("source", "externalId") WHERE "externalId" IS NOT NULL;
