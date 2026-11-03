-- Schedule the worker with pg_cron + pg_net.
--
-- The job reads two Vault secrets you create once per project (see README):
--   project_url  e.g. https://<ref>.supabase.co
--   cron_secret  same value as the CRON_SECRET edge function secret
-- Until they exist the job simply sends nothing useful, so the migration is safe to apply first.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net  with schema extensions;

select cron.schedule(
  'poll-weather',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/poll-weather',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body    := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 20000
  );
  $$
);

select cron.schedule('prune-weather-history', '17 3 * * *', $$ select public.prune_history(); $$);
