"use client";

import { BackgroundDecorations } from "@/components/background-decorations";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorProps) {
  return (
    <>
      <BackgroundDecorations />
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="animate-fade-in-up flex w-full max-w-md flex-col items-center text-center">
            <div className="bg-destructive/10 ring-destructive/20 shadow-destructive/5 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ring-1">
              <AlertTriangle className="text-destructive h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Something Went Wrong
            </h1>
            <p className="text-muted-foreground mt-2 max-w-sm">
              An unexpected error occurred. Please try again or go back to the
              home page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={reset} size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
