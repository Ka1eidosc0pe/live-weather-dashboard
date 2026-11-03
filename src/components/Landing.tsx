"use client";

import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Stage } from "./scene/Stage";
import type { SceneKind } from "@/lib/weather";

const SHOWREEL: { scene: SceneKind; isDay: boolean }[] = [
  { scene: "clear", isDay: true },
  { scene: "rain", isDay: true },
  { scene: "snow", isDay: true },
  { scene: "storm", isDay: false },
  { scene: "clear", isDay: false },
];

/** Signed-out view: a looping Chicago showreel behind the sign-in call to action. */
export function Landing({ loading = false }: { loading?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SHOWREEL.length), 9000);
    return () => clearInterval(t);
  }, []);
  const { scene, isDay } = SHOWREEL[i];

  return (
    <main className="fixed inset-0 overflow-hidden">
      <Stage cityId="chicago" scene={scene} isDay={isDay} />
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6">
        <div className="pointer-events-auto w-[min(92vw,28rem)] rounded-[2rem] border border-white/15 bg-black/25 p-8 text-center text-white shadow-2xl backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/55">Skyline</p>
          <h1 className="mt-3 text-4xl font-light leading-tight tracking-tight">Live weather,<br />drawn as your city.</h1>
          <p className="mt-4 text-sm text-white/65">Pick your cities and watch their skylines react to the real weather. Poke the sun, the rain and the snow. Everything updates live.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {loading ? (
              <span className="h-10 w-28 animate-pulse rounded-full bg-white/15" aria-label="Loading" />
            ) : (
              <SignInButton mode="modal">
                <button className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white/90">Sign in</button>
              </SignInButton>
            )}
            <Link href="/preview" className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/85 transition hover:bg-white/10">
              Browse scenes
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
