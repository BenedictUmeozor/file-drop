import Link from "next/link"
import { cn } from "@/lib/utils"

interface FooterProps {
  variant?: "full" | "minimal"
  className?: string
}

export function Footer({ variant = "minimal", className }: FooterProps) {
  if (variant === "full") {
    return (
      <footer className={cn("border-t bg-background py-6 md:py-0", className)}>
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="https://benedictumeozor.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Benedict
            </a>
            . The source code is available on{" "}
            <a
              href="https://github.com/benedictumeozor/file-drop"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:underline">
              Terms
            </Link>
            <Link href="#" className="hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className={cn("border-t py-6 md:py-8", className)}>
      <div className="container flex flex-col items-center justify-center gap-4 md:h-16 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} FileDrop. Secure File Transfer.
        </p>
      </div>
    </footer>
  )
}

