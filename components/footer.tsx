import { cn } from "@/lib/utils";
import Link from "next/link";

interface FooterProps {
  variant?: "full" | "minimal";
  className?: string;
}

export function Footer({ variant = "minimal", className }: FooterProps) {
  if (variant === "full") {
    return (
      <footer className={cn("bg-background border-t py-6 md:py-0", className)}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:h-16 md:flex-row">
          <p className="text-muted-foreground text-center text-sm leading-loose md:text-left">
            Built by{" "}
            <a
              href="https://benedictumeozor.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Benedict
            </a>
            .
          </p>
          <div className="text-muted-foreground flex gap-4 text-sm">
            <Link href="#" className="hover:underline">
              Terms
            </Link>
            <Link href="#" className="hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("border-t py-6 md:py-8", className)}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 sm:px-6 md:h-16 md:flex-row">
        <p className="text-muted-foreground text-center text-sm leading-loose text-balance md:text-left">
          © {new Date().getFullYear()} FileDrop. Secure File Transfer.
        </p>
      </div>
    </footer>
  );
}
