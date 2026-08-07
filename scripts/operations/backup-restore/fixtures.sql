-- fixtures.sql — datos sintéticos deterministas del harness B3-BACKUP-01.
--
-- Spec: docs/specs/features/backup-restore-verification.md
--
-- REGLAS DURAS:
--   * Solo datos SINTÉTICOS. Ningún nombre, correo, CV ni contenido real.
--   * Correos bajo `.invalid` (RFC 2606): dominio reservado, jamás enrutable.
--   * Prefijo `b3backup-` en todo valor reconocible.
--   * UUID y timestamps LITERALES fijos: nunca gen_random_uuid() ni now(). Es lo
--     que hace reproducibles los recuentos, los ordenamientos y los hashes
--     deterministas entre ejecuciones distintas.
--   * Cobertura obligatoria: las 12 tablas de aplicación reciben al menos una fila.
--
-- Se aplica DESPUÉS de `prisma migrate deploy`. No crea ni altera schema.
--
-- Recuentos esperados (27 filas en total):
--   User 3 · RefreshToken 2 · CandidateProfile 2 · PortfolioSettings 1 · Skill 4
--   Experience 2 · Education 1 · Project 1 · Link 2 · JobPreferences 1
--   Job 5 · SavedJob 3

BEGIN;

-- ---------------------------------------------------------------- User (3)
INSERT INTO "User" ("id", "email", "passwordHash", "role", "createdAt", "updatedAt") VALUES
  ('b3b00001-0000-4000-8000-000000000001', 'b3backup-user-1@example.invalid',
   'b3backup-not-a-real-hash-1', 'CANDIDATE',
   '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
  ('b3b00001-0000-4000-8000-000000000002', 'b3backup-user-2@example.invalid',
   'b3backup-not-a-real-hash-2', 'CANDIDATE',
   '2026-01-02 00:00:00', '2026-01-02 00:00:00'),
  ('b3b00001-0000-4000-8000-000000000003', 'b3backup-user-3@example.invalid',
   'b3backup-not-a-real-hash-3', 'CANDIDATE',
   '2026-01-03 00:00:00', '2026-01-03 00:00:00');

-- -------------------------------------------------------- RefreshToken (2)
-- Una vigente y una revocada: ejercita la columna nullable `revokedAt`.
INSERT INTO "RefreshToken" ("id", "userId", "tokenHash", "expiresAt", "revokedAt", "createdAt") VALUES
  ('b3b00002-0000-4000-8000-000000000001', 'b3b00001-0000-4000-8000-000000000001',
   'b3backup-token-hash-1', '2026-12-31 00:00:00', NULL, '2026-01-01 00:00:00'),
  ('b3b00002-0000-4000-8000-000000000002', 'b3b00001-0000-4000-8000-000000000002',
   'b3backup-token-hash-2', '2026-12-31 00:00:00', '2026-02-01 00:00:00', '2026-01-02 00:00:00');

-- ---------------------------------------------------- CandidateProfile (2)
-- El primer perfil referencia un archivo REAL del volumen de uploads sintéticos:
-- es el punto de verificación de coherencia registro <-> archivo (verificación 18).
INSERT INTO "CandidateProfile" (
  "id", "userId", "firstName", "lastName", "headline", "summary", "location",
  "locationRemote", "availabilityStatus", "avatarUrl", "createdAt", "updatedAt"
) VALUES
  ('b3b00003-0000-4000-8000-000000000001', 'b3b00001-0000-4000-8000-000000000001',
   'B3backup', 'Uno', 'b3backup-headline-1', 'b3backup-summary-1', 'b3backup-city-1',
   true, 'ACTIVE', '/uploads/avatars/b3backup-avatar-1.png',
   '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
  ('b3b00003-0000-4000-8000-000000000002', 'b3b00001-0000-4000-8000-000000000002',
   'B3backup', 'Dos', 'b3backup-headline-2', NULL, NULL,
   false, 'OPEN', NULL,
   '2026-01-02 00:00:00', '2026-01-02 00:00:00');

-- --------------------------------------------------- PortfolioSettings (1)
INSERT INTO "PortfolioSettings" (
  "id", "userId", "slug", "isPublished", "publishedAt",
  "showLocation", "showAvailability", "showPreferences", "createdAt", "updatedAt"
) VALUES
  ('b3b00004-0000-4000-8000-000000000001', 'b3b00001-0000-4000-8000-000000000001',
   'b3backup-portfolio-1', true, '2026-01-05 00:00:00',
   true, true, false, '2026-01-01 00:00:00', '2026-01-05 00:00:00');

-- ------------------------------------------------------------- Skill (4)
-- Ejercita @@unique(profileId, normalizedName) y el enum SkillLevel nullable.
INSERT INTO "Skill" ("id", "profileId", "name", "normalizedName", "level", "category") VALUES
  ('b3b00005-0000-4000-8000-000000000001', 'b3b00003-0000-4000-8000-000000000001',
   'B3backup Skill Alpha', 'b3backup-skill-alpha', 'ADVANCED', 'b3backup-category-1'),
  ('b3b00005-0000-4000-8000-000000000002', 'b3b00003-0000-4000-8000-000000000001',
   'B3backup Skill Beta', 'b3backup-skill-beta', 'INTERMEDIATE', 'b3backup-category-1'),
  ('b3b00005-0000-4000-8000-000000000003', 'b3b00003-0000-4000-8000-000000000001',
   'B3backup Skill Gamma', 'b3backup-skill-gamma', NULL, NULL),
  ('b3b00005-0000-4000-8000-000000000004', 'b3b00003-0000-4000-8000-000000000002',
   'B3backup Skill Alpha', 'b3backup-skill-alpha', 'BASIC', 'b3backup-category-2');

-- -------------------------------------------------------- Experience (2)
INSERT INTO "Experience" (
  "id", "profileId", "company", "role", "startDate", "endDate", "current", "description", "location"
) VALUES
  ('b3b00006-0000-4000-8000-000000000001', 'b3b00003-0000-4000-8000-000000000001',
   'b3backup-company-1', 'b3backup-role-1', '2024-01-01 00:00:00', '2025-01-01 00:00:00',
   false, 'b3backup-description-1', 'b3backup-city-1'),
  ('b3b00006-0000-4000-8000-000000000002', 'b3b00003-0000-4000-8000-000000000001',
   'b3backup-company-2', 'b3backup-role-2', '2025-02-01 00:00:00', NULL,
   true, NULL, NULL);

-- --------------------------------------------------------- Education (1)
INSERT INTO "Education" (
  "id", "profileId", "institution", "title", "field", "startDate", "endDate", "current"
) VALUES
  ('b3b00007-0000-4000-8000-000000000001', 'b3b00003-0000-4000-8000-000000000001',
   'b3backup-institution-1', 'b3backup-title-1', 'b3backup-field-1',
   '2020-09-01 00:00:00', '2024-06-30 00:00:00', false);

-- ----------------------------------------------------------- Project (1)
-- Array de 3 elementos: entra en la verificación 12 (longitudes de arrays).
INSERT INTO "Project" (
  "id", "profileId", "name", "description", "technologies", "url", "repoUrl"
) VALUES
  ('b3b00008-0000-4000-8000-000000000001', 'b3b00003-0000-4000-8000-000000000001',
   'b3backup-project-1', 'b3backup-project-description-1',
   ARRAY['b3backup-tech-1','b3backup-tech-2','b3backup-tech-3'],
   'https://example.invalid/b3backup-project-1',
   'https://example.invalid/b3backup-repo-1');

-- -------------------------------------------------------------- Link (2)
INSERT INTO "Link" ("id", "profileId", "type", "url") VALUES
  ('b3b00009-0000-4000-8000-000000000001', 'b3b00003-0000-4000-8000-000000000001',
   'GITHUB', 'https://example.invalid/b3backup-github-1'),
  ('b3b00009-0000-4000-8000-000000000002', 'b3b00003-0000-4000-8000-000000000001',
   'OTHER', 'https://example.invalid/b3backup-other-1');

-- --------------------------------------------------- JobPreferences (1)
INSERT INTO "JobPreferences" (
  "id", "profileId", "desiredRoles", "preferredLocations",
  "remotePreference", "seniority", "salaryMin", "salaryMax", "contractTypes"
) VALUES
  ('b3b0000a-0000-4000-8000-000000000001', 'b3b00003-0000-4000-8000-000000000001',
   ARRAY['b3backup-role-a','b3backup-role-b'],
   ARRAY['b3backup-location-a'],
   'REMOTE', 'SENIOR', 30000, 45000,
   ARRAY['b3backup-contract-a','b3backup-contract-b']);

-- --------------------------------------------------------------- Job (5)
-- Cubre los cuatro enums de oferta, una fila CLOSED y una de fuente GREENHOUSE
-- con externalId (índice único parcial por (source, externalId)).
INSERT INTO "Job" (
  "id", "title", "company", "location", "remoteType", "description", "requirements",
  "seniority", "contractType", "salaryMin", "salaryMax", "tags", "status",
  "postedAt", "expiresAt", "source", "externalId", "sourceUrl", "ingestedAt"
) VALUES
  ('b3b0000b-0000-4000-8000-000000000001', 'b3backup-job-1', 'b3backup-employer-1',
   'b3backup-city-1', 'REMOTE', 'b3backup-job-description-1',
   ARRAY['b3backup-req-1','b3backup-req-2'], 'SENIOR', 'b3backup-contract-a',
   40000, 55000, ARRAY['b3backup-tag-1','b3backup-tag-2'], 'ACTIVE',
   '2026-01-10 00:00:00', NULL, 'INTERNAL', NULL, NULL, NULL),
  ('b3b0000b-0000-4000-8000-000000000002', 'b3backup-job-2', 'b3backup-employer-1',
   NULL, 'HYBRID', 'b3backup-job-description-2',
   ARRAY['b3backup-req-3'], 'MID', 'b3backup-contract-b',
   NULL, NULL, ARRAY['b3backup-tag-1'], 'ACTIVE',
   '2026-01-11 00:00:00', '2026-06-30 00:00:00', 'INTERNAL', NULL, NULL, NULL),
  ('b3b0000b-0000-4000-8000-000000000003', 'b3backup-job-3', 'b3backup-employer-2',
   'b3backup-city-2', 'ON_SITE', 'b3backup-job-description-3',
   ARRAY[]::TEXT[], 'JUNIOR', 'b3backup-contract-a',
   22000, NULL, ARRAY[]::TEXT[], 'ACTIVE',
   '2026-01-12 00:00:00', NULL, 'INTERNAL', NULL, NULL, NULL),
  ('b3b0000b-0000-4000-8000-000000000004', 'b3backup-job-4-closed', 'b3backup-employer-2',
   'b3backup-city-2', 'UNSPECIFIED', 'b3backup-job-description-4',
   ARRAY['b3backup-req-4'], 'ANY', 'b3backup-contract-b',
   NULL, NULL, ARRAY['b3backup-tag-3'], 'CLOSED',
   '2026-01-13 00:00:00', '2026-02-01 00:00:00', 'INTERNAL', NULL, NULL, NULL),
  ('b3b0000b-0000-4000-8000-000000000005', 'b3backup-job-5-greenhouse', 'b3backup-employer-3',
   NULL, 'REMOTE', 'b3backup-job-description-5',
   ARRAY['b3backup-req-5'], 'SENIOR', 'b3backup-contract-a',
   NULL, NULL, ARRAY['b3backup-tag-4'], 'ACTIVE',
   '2026-01-14 00:00:00', NULL, 'GREENHOUSE', 'b3backup-external-5',
   'https://example.invalid/b3backup-job-5', '2026-01-14 00:00:00');

-- ---------------------------------------------------------- SavedJob (3)
-- Ejercita @@unique(userId, jobId) y la doble clave foránea.
INSERT INTO "SavedJob" ("id", "userId", "jobId", "savedAt") VALUES
  ('b3b0000c-0000-4000-8000-000000000001', 'b3b00001-0000-4000-8000-000000000001',
   'b3b0000b-0000-4000-8000-000000000001', '2026-01-20 00:00:00'),
  ('b3b0000c-0000-4000-8000-000000000002', 'b3b00001-0000-4000-8000-000000000001',
   'b3b0000b-0000-4000-8000-000000000005', '2026-01-21 00:00:00'),
  ('b3b0000c-0000-4000-8000-000000000003', 'b3b00001-0000-4000-8000-000000000002',
   'b3b0000b-0000-4000-8000-000000000001', '2026-01-22 00:00:00');

COMMIT;
