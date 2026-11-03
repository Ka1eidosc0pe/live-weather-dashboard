-- Live weather dashboard: schema, RLS and realtime publication.
--
-- Auth: Clerk is registered as a Supabase third-party auth provider, so the
-- Clerk session token is the Supabase JWT and auth.jwt()->>'sub' is the Clerk user id.

-- ---------------------------------------------------------------------------
-- cities: the catalogue users pick from. `animated` marks launch cities that
-- have a bespoke scene in the UI.
-- ---------------------------------------------------------------------------
create table public.cities (
  id        text primary key,
  name      text not null,
  country   text not null,
  latitude  double precision not null,
  longitude double precision not null,
  animated  boolean not null default false,
  sort      int not null default 100
);

insert into public.cities (id, name, country, latitude, longitude, animated, sort) values
  ('chicago',       'Chicago',       'United States',  41.8781,  -87.6298, true,  1),
  ('new-york',      'New York',      'United States',  40.7128,  -74.0060, true,  2),
  ('san-francisco', 'San Francisco', 'United States',  37.7749, -122.4194, true,  3),
  ('london',        'London',        'United Kingdom', 51.5072,   -0.1276, true,  4),
  ('tokyo',         'Tokyo',         'Japan',          35.6762,  139.6503, true,  5),
  ('singapore',     'Singapore',     'Singapore',       1.3521,  103.8198, true,  6),
  ('los-angeles',   'Los Angeles',   'United States',  34.0522, -118.2437, false, 20),
  ('seattle',       'Seattle',       'United States',  47.6062, -122.3321, false, 21),
  ('miami',         'Miami',         'United States',  25.7617,  -80.1918, false, 22),
  ('toronto',       'Toronto',       'Canada',         43.6532,  -79.3832, false, 23),
  ('mexico-city',   'Mexico City',   'Mexico',         19.4326,  -99.1332, false, 24),
  ('sao-paulo',     'São Paulo',     'Brazil',        -23.5505,  -46.6333, false, 25),
  ('paris',         'Paris',         'France',         48.8566,    2.3522, false, 26),
  ('berlin',        'Berlin',        'Germany',        52.5200,   13.4050, false, 27),
  ('reykjavik',     'Reykjavík',     'Iceland',        64.1466,  -21.9426, false, 28),
  ('cairo',         'Cairo',         'Egypt',          30.0444,   31.2357, false, 29),
  ('cape-town',     'Cape Town',     'South Africa',  -33.9249,   18.4241, false, 30),
  ('dubai',         'Dubai',         'UAE',            25.2048,   55.2708, false, 31),
  ('mumbai',        'Mumbai',        'India',          19.0760,   72.8777, false, 32),
  ('bangkok',       'Bangkok',       'Thailand',       13.7563,  100.5018, false, 33),
  ('seoul',         'Seoul',         'South Korea',    37.5665,  126.9780, false, 34),
  ('sydney',        'Sydney',        'Australia',     -33.8688,  151.2093, false, 35);

-- ---------------------------------------------------------------------------
-- weather_current: latest known state per city. Only rewritten by the worker
-- when something actually changed.
-- ---------------------------------------------------------------------------
create table public.weather_current (
  city_id        text primary key references public.cities (id) on delete cascade,
  temperature_c  real not null,
  apparent_c     real not null,
  humidity       real not null,
  precipitation  real not null,   -- mm in the last interval
  cloud_cover    real not null,
  weather_code   int  not null,   -- WMO code
  is_day         boolean not null,
  wind_kph       real not null,
  wind_gust_kph  real not null,
  wind_dir       int  not null,
  observed_at    timestamptz not null,  -- timestamp Open-Meteo reports for the reading
  forecast       jsonb not null default '{}'::jsonb, -- { hourly: [...], daily: [...] }
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- weather_changes: append-only log of what moved between two readings.
-- ---------------------------------------------------------------------------
create table public.weather_changes (
  id         bigint generated always as identity primary key,
  city_id    text not null references public.cities (id) on delete cascade,
  changes    jsonb not null,  -- { field: { from, to } }
  created_at timestamptz not null default now()
);
create index weather_changes_created_idx on public.weather_changes (created_at desc);

-- ---------------------------------------------------------------------------
-- worker_runs: one row per worker invocation, success or failure. The UI
-- derives fresh / stale / outdated / failed from this table.
-- ---------------------------------------------------------------------------
create table public.worker_runs (
  id              bigint generated always as identity primary key,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz not null default now(),
  status          text not null check (status in ('success', 'error')),
  cities_checked  int  not null default 0,
  cities_changed  int  not null default 0,
  error           text
);
create index worker_runs_started_idx on public.worker_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- user_cities: each user's selected cities, keyed by Clerk user id.
-- ---------------------------------------------------------------------------
create table public.user_cities (
  user_id    text not null default (auth.jwt() ->> 'sub'),
  city_id    text not null references public.cities (id) on delete cascade,
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, city_id)
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.cities          enable row level security;
alter table public.weather_current enable row level security;
alter table public.weather_changes enable row level security;
alter table public.worker_runs     enable row level security;
alter table public.user_cities     enable row level security;

-- Reference + weather data is public to signed-in users; only the worker
-- (service role, bypasses RLS) writes it.
create policy "cities readable"          on public.cities          for select to authenticated using (true);
create policy "weather readable"         on public.weather_current for select to authenticated using (true);
create policy "changes readable"         on public.weather_changes for select to authenticated using (true);
create policy "worker runs readable"     on public.worker_runs     for select to authenticated using (true);

-- Users manage only their own selections.
create policy "own selections read"   on public.user_cities for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
create policy "own selections insert" on public.user_cities for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "own selections update" on public.user_cities for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "own selections delete" on public.user_cities for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.weather_current, public.weather_changes, public.worker_runs, public.user_cities;

-- Keep old runs/changes from growing forever (used by the cron cleanup job).
create or replace function public.prune_history() returns void
language sql security definer set search_path = '' as $$
  delete from public.worker_runs     where started_at < now() - interval '7 days';
  delete from public.weather_changes where created_at < now() - interval '14 days';
$$;
revoke all on function public.prune_history() from public, anon, authenticated;
