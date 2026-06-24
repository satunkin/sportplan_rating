-- Defense-in-depth for Supabase public schema exposure.
-- The app uses a direct PostgreSQL connection through Prisma, not Supabase
-- Data API roles. Keep every current application table behind RLS and remove
-- broad Data API grants unless a future feature opts into them explicitly.

DO $$
DECLARE
  app_tables text[] := ARRAY[
    'User',
    'Athlete',
    'Season',
    'EventCategory',
    'Series',
    'Competition',
    'Event',
    'EventProtocolRow',
    'ProtocolGroup',
    'ResultSubmission',
    'VerifiedResult',
    'Club',
    'Coach',
    'AthleteClub',
    'AthleteCoach',
    'EntityProposal',
    'AthleteLinkRequest',
    'TelegramConversation',
    'TelegramUpdate',
    'TelegramNotification',
    'ScoreRule',
    'RankingEntry',
    'ManualReview',
    'AuditLog',
    'MagicLinkToken'
  ];
  exposed_roles text[] := ARRAY['anon', 'authenticated', 'service_role'];
  app_table text;
  exposed_role text;
BEGIN
  FOREACH app_table IN ARRAY app_tables LOOP
    IF to_regclass(format('public.%I', app_table)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', app_table);

      FOREACH exposed_role IN ARRAY exposed_roles LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = exposed_role) THEN
          EXECUTE format(
            'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I',
            app_table,
            exposed_role
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    FOREACH exposed_role IN ARRAY exposed_roles LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = exposed_role) THEN
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM %I',
          exposed_role
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL PRIVILEGES ON SEQUENCES FROM %I',
          exposed_role
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL PRIVILEGES ON FUNCTIONS FROM %I',
          exposed_role
        );
      END IF;
    END LOOP;
  END IF;
END $$;
