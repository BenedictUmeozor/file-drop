import { Github } from "lucide-react";
import Link from "next/link";

interface FooterProps {
  variant?: "full" | "minimal";
}

export function Footer({ variant = "minimal" }: FooterProps) {
  if (variant === "full") {
    return (
      <footer className="relative z-10 w-full py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mb-4 flex items-center justify-center gap-6 font-medium">
          <Link href="#" className="transition-colors hover:text-primary">
            Terms
          </Link>
          <Link href="#" className="transition-colors hover:text-primary">
            Privacy
          </Link>
          <Link href="#" className="transition-colors hover:text-primary">
            Security
          </Link>
        </div>
        <p className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} FileDrop. Crafted by
          <a
            href="https://benedictumeozor.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-1 font-medium text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary-light"
          >
             Benedict <Github className="h-3 w-3" />
          </a>
        </p>
      </footer>
    );
  }

  return (
    <footer className="relative z-10 w-full py-8 text-center text-sm text-gray-400 dark:text-gray-600">
      <p>© {new Date().getFullYear()} FileDrop. Secure File Transfer.</p>
    </footer>
  );
}
