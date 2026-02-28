import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Clock,
  Download,
  HardDrive,
  QrCode,
  Share2,
  Shield,
  Smartphone,
  Upload,
  Zap,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "Upload your file",
    description:
      "Drag and drop your file or click to browse. Supports all common formats up to 200MB.",
    icon: Upload,
  },
  {
    number: 2,
    title: "Share the link or QR code",
    description:
      "Get an instant shareable link and QR code. Send it via any messaging app or let others scan it.",
    icon: Share2,
  },
  {
    number: 3,
    title: "Recipient downloads",
    description:
      "Anyone with the link can download the file instantly. No account or app required.",
    icon: Download,
  },
  {
    number: 4,
    title: "File auto-expires",
    description:
      "Your file is automatically deleted after the expiry time for privacy and security.",
    icon: Clock,
  },
];

const features = [
  {
    title: "No account required",
    description: "Start sharing immediately without sign-ups or logins.",
    icon: Zap,
  },
  {
    title: "Instant QR code",
    description: "Perfect for sharing between your phone and computer.",
    icon: QrCode,
  },
  {
    title: "Works on any device",
    description: "Mobile, tablet, or desktop—just open in a browser.",
    icon: Smartphone,
  },
  {
    title: "Auto-expiration",
    description: "Files are deleted automatically for your privacy.",
    icon: Shield,
  },
  {
    title: "Up to 200MB",
    description: "Share documents, images, videos, and more.",
    icon: HardDrive,
  },
];

export default function HowItWorks() {
  return (
    <>
      <Header />

      <main className="bg-background">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="w-fit rounded-full px-4 py-1.5 text-sm font-medium"
              >
                How it works
              </Badge>

              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                Share files in four simple steps.
              </h1>

              <p className="max-w-2xl text-lg text-muted-foreground">
                No accounts, no installations. Just upload, share, and your file
                disappears when you want it to.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/#upload">Start sharing</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#process">See the process</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="process" className="border-t scroll-mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Four steps to instant sharing
              </h2>
              <p className="text-muted-foreground">
                From upload to auto-expiry, every step is built to keep sharing
                simple and secure.
              </p>
            </div>

            <ol className="relative mt-8 space-y-4">
              {steps.map((step, index) => (
                <li key={step.number} className="relative pl-12">
                  {index < steps.length - 1 ? (
                    <div
                      className="bg-border absolute top-10 left-5 h-[calc(100%-0.5rem)] w-px"
                      aria-hidden="true"
                    />
                  ) : null}

                  <div className="bg-background text-muted-foreground absolute top-5 left-0 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">
                    {step.number}
                  </div>

                  <Card className="shadow-sm dark:shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted/50 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border">
                          <step.icon
                            className="text-muted-foreground h-4 w-4"
                            aria-hidden="true"
                          />
                        </div>
                        <CardTitle className="pt-1 text-base">
                          {step.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Built for speed, privacy, and simplicity
              </h2>
              <p className="text-muted-foreground">
                Everything you need to share files quickly, without adding
                friction to your workflow.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50">
                    <feature.icon
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <Card className="mx-auto max-w-3xl shadow-sm dark:shadow-none">
              <CardHeader className="items-center text-center">
                <div className="bg-muted/50 mb-2 flex h-10 w-10 items-center justify-center rounded-md border">
                  <Upload className="text-muted-foreground h-5 w-5" aria-hidden="true" />
                </div>

                <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ready to share files securely?
                </CardTitle>
                <CardDescription className="max-w-xl text-sm md:text-base">
                  No account needed. Files are encrypted in your browser before
                  upload and auto-expire for your privacy.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center justify-center gap-3 pt-0 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/#upload">
                    Start sharing now
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Free forever · No sign-up
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
