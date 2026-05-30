-- Keep the existing application tables protected even if the remote Supabase
-- project drifted from the repository migration history.
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Season" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EventCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EventProtocolRow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResultSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerifiedResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ScoreRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RankingEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ManualReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MagicLinkToken" ENABLE ROW LEVEL SECURITY;

-- This app currently talks to Supabase over a direct PostgreSQL connection
-- through Prisma, not through the Data API. Revoke the legacy default grants
-- so future tables/functions in `public` are not auto-exposed over PostgREST /
-- GraphQL / supabase-js unless we opt in explicitly for a specific use case.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
