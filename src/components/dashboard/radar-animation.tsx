"use client";

export function RadarAnimation() {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      {/* Outer rings */}
      <div className="absolute h-64 w-64 rounded-full border border-primary/20" />
      <div className="absolute h-48 w-48 rounded-full border border-primary/30" />
      <div className="absolute h-32 w-32 rounded-full border border-primary/40" />
      <div className="absolute h-16 w-16 rounded-full border border-primary/50" />

      {/* Scanning line */}
      <div className="absolute h-32 w-1 origin-bottom animate-spin bg-gradient-to-t from-primary to-transparent [animation-duration:3s]" />

      {/* Center dot */}
      <div className="absolute h-4 w-4 rounded-full bg-primary shadow-lg shadow-primary/50" />

      {/* Pulse effect */}
      <div className="absolute h-64 w-64 animate-ping rounded-full bg-primary/10 [animation-duration:3s]" />

      {/* Random dots (potential matches) */}
      <div className="absolute h-2 w-2 animate-pulse rounded-full bg-primary/60" style={{ top: "30%", left: "60%" }} />
      <div className="absolute h-2 w-2 animate-pulse rounded-full bg-primary/60 [animation-delay:0.5s]" style={{ top: "60%", left: "25%" }} />
      <div className="absolute h-2 w-2 animate-pulse rounded-full bg-primary/60 [animation-delay:1s]" style={{ top: "45%", left: "70%" }} />
    </div>
  );
}
