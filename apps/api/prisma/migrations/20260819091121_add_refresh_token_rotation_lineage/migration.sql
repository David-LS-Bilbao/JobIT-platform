-- Rotacion de refresh token con soporte de schema (familia + linaje).
-- Spec: docs/specs/features/session-continuity-401-recovery.md
-- ADR:  docs/decisions/ADR-0014-session-continuity-refresh-contract.md
--
-- ADDITIVE · MINIMAL · BACKWARD_SAFE_WHERE_REASONABLY_POSSIBLE
-- No se borran filas, columnas ni tablas. No se modifican expiresAt, revokedAt,
-- userId, createdAt ni id. Sin reset.

-- 1-2. Columnas nuevas. familyId entra NULLABLE para poder rellenarla antes de
--      exigir NOT NULL: la tabla puede tener filas en un entorno ya en uso.
ALTER TABLE "RefreshToken" ADD COLUMN "familyId" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN "replacedById" TEXT;

-- 3. Backfill determinista e idempotente: cada token existente pasa a ser el root
--    de su propia familia. Es exacto, no una aproximacion: antes de esta migracion
--    no existia rotacion, luego cada fila procede de un login o register propio.
--    replacedById queda NULL, historicamente exacto: el unico escritor previo de
--    revokedAt era el logout.
UPDATE "RefreshToken" SET "familyId" = "id" WHERE "familyId" IS NULL;

-- 4. Ya sin nulos, se exige la restriccion.
ALTER TABLE "RefreshToken" ALTER COLUMN "familyId" SET NOT NULL;

-- 5. Unicidad del hash: impide dos filas con el mismo tokenHash y aporta el indice
--    de la consulta mas frecuente del endpoint.
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- 6. Unicidad del enlace de linaje: impide la CONVERGENCIA (dos predecessors
--    referenciando el mismo successor) y satisface la relacion 1:1 de Prisma.
CREATE UNIQUE INDEX "RefreshToken_replacedById_key" ON "RefreshToken"("replacedById");

-- 7. Indice de familia: soporta el conteo de estado y el updateMany de revocacion.
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- 8. Auto-relacion predecessor -> successor.
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedById_fkey"
  FOREIGN KEY ("replacedById") REFERENCES "RefreshToken"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
