import { Github } from "lucide-react";
import Link from "next/link";

interface FooterProps {
  variant?: "full" | "minimal";
}

export function Footer({ variant = "minimal" }: FooterProps) {
  if (variant === "full") {
    return (
      <footer className="relative z-10 w-full py-8 text-center text-sm text-slate-400 dark:text-slate-600">
        <div className="mb-4 flex items-center justify-center gap-6">
          <Link href="#" className="transition-colors hover:text-cyan-500">
            Terms
          </Link>
          <Link href="#" className="transition-colors hover:text-cyan-500">
            Privacy
          </Link>
          <Link href="#" className="transition-colors hover:text-cyan-500">
            Security
          </Link>
        </div>
        <p className="flex items-center justify-center gap-1">
          © {new Date().getFullYear()} FileDrop. Crafted by
          <a
            href="https://github.com/BenedictUmeozor"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400"
          >
            Benedict <Github className="h-3 w-3" />
          </a>
        </p>
      </footer>
    );
  }

  return (
    <footer className="relative z-10 w-full py-8 text-center text-sm text-slate-400 dark:text-slate-600">
      <p>© {new Date().getFullYear()} FileDrop. Secure File Transfer.</p>
    </footer>
  );
}
