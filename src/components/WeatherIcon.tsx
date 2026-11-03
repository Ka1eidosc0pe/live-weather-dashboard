import type { SceneKind } from "@/lib/weather";

/** Minimal line icons, one per scene. */
export function WeatherIcon({ kind, night = false, className = "h-6 w-6" }: { kind: SceneKind; night?: boolean; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const cloud = <path d="M7 18h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z" {...common} />;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {kind === "clear" &&
        (night ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" {...common} />
        ) : (
          <g {...common}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
          </g>
        ))}
      {kind === "partly" && (
        <g {...common}>
          <path d="M9 4v1.5M3.8 6.5l1.1 1.1M2.5 12H4M14.2 6.5l-1.1 1.1" />
          <circle cx="9" cy="11" r="3" />
          <path d="M9 20h9a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 9.6 14 3 3 0 0 0 9 20z" />
        </g>
      )}
      {kind === "cloudy" && cloud}
      {kind === "fog" && (
        <g {...common}>
          <path d="M7 13h10a4 4 0 0 0 .4-7.98A5.5 5.5 0 0 0 7 4.5 4.25 4.25 0 0 0 7 13z" />
          <path d="M4 17h16M7 21h10" />
        </g>
      )}
      {(kind === "drizzle" || kind === "rain") && (
        <g {...common}>
          <path d="M7 14h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7 5.5 4.25 4.25 0 0 0 7 14z" />
          <path d={kind === "rain" ? "M8 17l-1 3M12 17l-1 3M16 17l-1 3" : "M8 18l-.5 1.5M12 18l-.5 1.5M16 18l-.5 1.5"} />
        </g>
      )}
      {kind === "snow" && (
        <g {...common}>
          <path d="M7 14h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7 5.5 4.25 4.25 0 0 0 7 14z" />
          <path d="M8 17.5v.01M12 19v.01M16 17.5v.01M10 21v.01M14 21v.01" strokeWidth="2.4" />
        </g>
      )}
      {kind === "storm" && (
        <g {...common}>
          <path d="M7 14h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7 5.5 4.25 4.25 0 0 0 7 14z" />
          <path d="m12 14-2 4h3l-2 4" />
        </g>
      )}
      {kind === "tornado" && (
        <g {...common}>
          <path d="M4 5h16M6 9h12M8 13h8M10 17h4M12 21v-1" />
        </g>
      )}
    </svg>
  );
}
