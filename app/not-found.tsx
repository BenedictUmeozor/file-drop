import { BackgroundDecorations } from "@/components/background-decorations";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <BackgroundDecorations />
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="animate-fade-in-up flex w-full max-w-md flex-col items-center text-center">
            <div className="bg-muted ring-border/60 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1">
              <FileQuestion className="text-muted-foreground h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Page Not Found
            </h1>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It
              may have been moved or deleted.
            </p>

            <Button asChild className="mt-8" size="lg">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
