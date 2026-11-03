import type { Metadata } from "next";
import { SCENE_KINDS, type SceneKind } from "@/lib/weather";
import { Playground } from "./Playground";

export const metadata: Metadata = { title: "Scene preview — Skyline" };

// /preview?city=tokyo&scene=snow&day=0
export default async function PreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const scene = SCENE_KINDS.includes(q.scene as SceneKind) ? (q.scene as SceneKind) : "clear";
  return <Playground initialCity={q.city ?? "chicago"} initialScene={scene} initialDay={q.day !== "0"} />;
}
