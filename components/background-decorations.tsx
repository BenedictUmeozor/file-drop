export function BackgroundDecorations() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Radial Gradient Orbs */}
      <div className="absolute left-[10%] top-[-10%] h-125 w-125 rounded-full bg-primary/5 blur-[100px] dark:bg-primary/10 animate-float" />
      <div className="absolute right-[10%] top-[20%] h-100 w-100 rounded-full bg-chart-2/5 blur-[100px] dark:bg-chart-2/10 animate-float [animation-delay:2s]" />
      <div className="absolute bottom-[-10%] left-[20%] h-150 w-150 rounded-full bg-chart-4/5 blur-[120px] dark:bg-chart-4/10 animate-float [animation-delay:4s]" />

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
}

