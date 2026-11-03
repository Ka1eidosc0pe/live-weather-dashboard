"use client";

import { useAuth } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef } from "react";

// Clerk is a Supabase third-party auth provider: the Clerk session token is sent as the
// Supabase JWT, so RLS sees auth.jwt()->>'sub' as the Clerk user id (REST and Realtime).
export function useSupabase(): SupabaseClient {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  return useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        accessToken: async () => (await getTokenRef.current()) ?? null,
      }),
    [],
  );
}
