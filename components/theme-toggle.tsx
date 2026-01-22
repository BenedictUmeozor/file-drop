"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      className="group rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="group-hover:text-primary h-5 w-5 scale-100 rotate-0 text-slate-500 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="group-hover:text-primary absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 scale-0 rotate-90 text-slate-500 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
