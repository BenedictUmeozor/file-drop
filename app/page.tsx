import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import { Clock, Lock, QrCode, Shield, Zap } from "lucide-react";
import Link from "next/link";

const trustIndicators = [
  {
    icon: Shield,
    label: "End-to-end encrypted",
  },
  {
    icon: Clock,
    label: "Auto-expiring files",
  },
  {
    icon: Zap,
    label: "No account needed",
  },
];

const highlights = [
  {
    icon: Lock,
    title: "Browser encryption",
    description: "Files encrypted locally before they ever leave your device.",
  },
  {
    icon: QrCode,
    title: "Instant QR codes",
    description: "Scan to share between devices in a single tap.",
  },
  {
    icon: Clock,
    title: "Auto-expiring links",
    description: "Files auto-expire after your chosen time window.",
  },
  {
    icon: Zap,
    title: "No account required",
    description: "No sign-ups, no apps to install. Just drop and share.",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main className="bg-background">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.05fr_1fr] md:items-start">
            <div className="space-y-8">
              <Badge
                variant="outline"
                className="w-fit rounded-full px-4 py-1.5 text-sm font-medium"
              >
                Secure file sharing
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                  Share files privately in seconds.
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground">
                  End-to-end encrypted transfer with automatic expiry and simple
                  sharing links. Upload once, share anywhere, and stay in
                  control of who can access your files.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="#upload">Start sharing</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/how-it-works">How it works</Link>
                </Button>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {trustIndicators.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="upload" className="scroll-mt-16 rounded-xl border bg-card p-3 shadow-sm dark:shadow-none sm:p-4">
              <UploadZone />
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Built for secure, no-friction sharing
              </h2>
              <p className="text-muted-foreground">
                Send sensitive files quickly without creating accounts or
                installing tools. Everything is designed around fast workflows
                and clear security defaults.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                See how it works →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="full" />
    </>
  );
}
