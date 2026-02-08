export function BackgroundDecorations() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      <div className="bg-background-light dark:bg-background-dark absolute inset-0 transition-colors duration-500" />
      <div className="bg-grid-pattern absolute inset-0 opacity-[0.6] dark:opacity-[0.4]" />

      <div className="animate-pulse-slow absolute top-[-20%] left-[20%] h-125 w-125 rounded-full bg-cyan-400/20 mix-blend-multiply blur-[120px] dark:bg-cyan-500/10 dark:mix-blend-screen" />
      <div className="absolute right-[10%] bottom-[-10%] h-150 w-150 rounded-full bg-blue-400/20 mix-blend-multiply blur-[120px] dark:bg-blue-600/10 dark:mix-blend-screen" />
    </div>
  );
}
