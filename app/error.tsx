"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="bg-background flex flex-1 items-center">
        <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
          <Card className="mx-auto w-full max-w-md shadow-sm dark:shadow-none">
            <CardHeader className="items-center text-center">
              <div className="bg-muted/50 mb-2 flex h-10 w-10 items-center justify-center rounded-md border">
                <AlertTriangle
                  className="text-muted-foreground h-5 w-5"
                  aria-hidden="true"
                />
              </div>
              <h1 className="text-2xl leading-none font-semibold tracking-tight">
                Something Went Wrong
              </h1>
              <CardDescription>
                An unexpected error occurred. Please try again or go back to the
                home page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-3 pt-0 sm:flex-row">
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
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
