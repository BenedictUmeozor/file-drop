import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center bg-background">
        <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
          <Card className="mx-auto w-full max-w-md shadow-sm dark:shadow-none">
            <CardHeader className="items-center text-center">
              <div className="bg-muted/50 mb-2 flex h-10 w-10 items-center justify-center rounded-md border">
                <FileQuestion
                  className="text-muted-foreground h-5 w-5"
                  aria-hidden="true"
                />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight leading-none">
                Page Not Found
              </h1>
              <CardDescription>
                We could not find that page. It may have been moved or removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-0">
              <Button asChild size="lg">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return Home
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
