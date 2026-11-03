"use client";

import { useAuth } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";

// Clerk is a Supabase third-party auth provider: the Clerk session token is sent as the
// Supabase JWT, so RLS sees auth.jwt()->>'sub' as the Clerk user id (REST and Realtime).
let getClerkToken: () => Promise<string | null> = async () => null;
let client: SupabaseClient | null = null;

export function useSupabase(): SupabaseClient {
  const { getToken } = useAuth();
  useEffect(() => {
    getClerkToken = () => getToken();
  }, [getToken]);

  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    accessToken: () => getClerkToken(),
  });
  return client;
}
