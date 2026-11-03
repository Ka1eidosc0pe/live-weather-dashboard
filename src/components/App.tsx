"use client";

import { useAuth } from "@clerk/nextjs";
import { Dashboard } from "./Dashboard";
import { Landing } from "./Landing";

export function App() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Landing loading />;
  return isSignedIn ? <Dashboard /> : <Landing />;
}
