"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      className="group relative flex items-center justify-center rounded-full p-1.5 transition-all hover:bg-slate-100 active:scale-95 sm:p-2.5 dark:hover:bg-slate-800"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <div className="grid h-5 w-5 place-items-center">
        <Sun className="col-start-1 row-start-1 h-5 w-5 scale-100 rotate-0 text-amber-500 transition-all duration-500 dark:scale-0 dark:-rotate-90" />
        <Moon className="col-start-1 row-start-1 h-5 w-5 scale-0 rotate-90 text-primary transition-all duration-500 dark:scale-100 dark:rotate-0" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
