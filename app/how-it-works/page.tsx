"use client";

import { BackgroundDecorations } from "@/components/background-decorations";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    accent:
      "from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10",
    iconColor: "text-blue-500 dark:text-blue-400",
    ringColor: "ring-blue-500/20",
  },
  {
    number: 2,
    title: "Share the link or QR code",
    description:
      "Get an instant shareable link and QR code. Send it via any messaging app or let others scan it.",
    icon: Share2,
    accent:
      "from-violet-500/20 to-purple-500/20 dark:from-violet-500/10 dark:to-purple-500/10",
    iconColor: "text-violet-500 dark:text-violet-400",
    ringColor: "ring-violet-500/20",
  },
  {
    number: 3,
    title: "Recipient downloads",
    description:
      "Anyone with the link can download the file instantly. No account or app required.",
    icon: Download,
    accent:
      "from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    ringColor: "ring-emerald-500/20",
  },
  {
    number: 4,
    title: "File auto-expires",
    description:
      "Your file is automatically deleted after the expiry time for privacy and security.",
    icon: Clock,
    accent:
      "from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10",
    iconColor: "text-amber-500 dark:text-amber-400",
    ringColor: "ring-amber-500/20",
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
      <BackgroundDecorations />
      <Header />

      <main className="relative flex-1">
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="from-primary/3 absolute inset-0 bg-linear-to-b via-transparent to-transparent" />
          <div className="relative container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex flex-col items-center text-center">
              <Badge
                variant="outline"
                className="animate-fade-in mb-6 rounded-full px-4 py-1.5 text-sm font-medium"
              >
                How it works
              </Badge>

              <h1 className="animate-fade-in-up fd-h1 max-w-3xl text-balance md:text-5xl lg:text-6xl">
                Sharing files should be{" "}
                <span className="gradient-text">effortless</span>
              </h1>

              <p className="animate-fade-in-up text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed [animation-delay:100ms]">
                No accounts, no installations. Just upload, share, and your file
                disappears when you want it to.
              </p>

              <div className="animate-fade-in-up mt-8 flex items-center gap-3 [animation-delay:200ms]">
                <Button asChild size="lg">
                  <Link href="/">
                    Start sharing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#process">See the process</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="relative py-16 md:py-24">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-12 flex flex-col items-center text-center md:mb-16">
              <p className="fd-kicker mb-3">Step by step</p>
              <h2 className="fd-h2 max-w-md text-balance">
                Four steps to instant sharing
              </h2>
            </div>

            <div className="relative">
              <div className="from-border via-primary/30 to-border absolute top-0 left-8 hidden h-full w-px bg-linear-to-b md:left-1/2 md:block" />

              <div className="space-y-8 md:space-y-0">
                {steps.map((step, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <div
                      key={step.number}
                      className="animate-fade-in-up relative md:flex md:items-center md:gap-8"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <div
                        className={`hidden md:flex md:w-1/2 ${isEven ? "md:justify-end" : "md:order-2 md:justify-start"}`}
                      >
                        <div
                          className={`group border-border/60 bg-card/60 hover:border-border relative w-full max-w-md rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`}
                        >
                          <div
                            className={`absolute inset-0 rounded-xl bg-linear-to-br ${step.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                          />
                          <div className="relative">
                            <div className="mb-4 flex items-center gap-3">
                              <div
                                className={`bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${step.ringColor} transition-all duration-300 group-hover:ring-2`}
                              >
                                <step.icon
                                  className={`h-5 w-5 ${step.iconColor}`}
                                />
                              </div>
                              <h3 className="text-lg font-semibold tracking-tight">
                                {step.title}
                              </h3>
                            </div>
                            <p className="text-muted-foreground text-[15px] leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute top-1/2 left-8 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:left-1/2 md:flex">
                        <div className="border-primary bg-background text-primary shadow-primary/10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold shadow-md transition-transform duration-300 hover:scale-110">
                          {step.number}
                        </div>
                      </div>

                      <div
                        className={`hidden md:flex md:w-1/2 ${isEven ? "md:order-2" : ""}`}
                      />

                      <div className="md:hidden">
                        <div className="group border-border/60 bg-card/60 hover:border-border relative rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                          <div
                            className={`absolute inset-0 rounded-xl bg-linear-to-br ${step.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                          />
                          <div className="relative">
                            <div className="mb-3 flex items-center gap-3">
                              <div className="border-primary bg-background text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold">
                                {step.number}
                              </div>
                              <div className="flex items-center gap-2">
                                <step.icon
                                  className={`h-4 w-4 ${step.iconColor}`}
                                />
                                <h3 className="text-base font-semibold tracking-tight">
                                  {step.title}
                                </h3>
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {index < steps.length - 1 && (
                        <div className="my-2 flex justify-center md:hidden">
                          <div className="from-primary/30 to-border h-6 w-px bg-linear-to-b" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-5xl" />

        <section className="relative py-16 md:py-24">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-12 flex flex-col items-center text-center md:mb-16">
              <p className="fd-kicker mb-3">Why FileDrop</p>
              <h2 className="fd-h2 max-w-lg text-balance">
                Built for speed, privacy, and simplicity
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="animate-fade-in-up group border-border/60 bg-card/60 hover:border-border hover:bg-card/80 relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="from-primary/3 absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative">
                    <div className="bg-muted/60 ring-border/60 group-hover:bg-primary/10 group-hover:ring-primary/20 mb-4 flex h-11 w-11 items-center justify-center rounded-lg ring-1 transition-all duration-300">
                      <feature.icon className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors duration-300" />
                    </div>

                    <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="from-primary/4 via-primary/2 absolute inset-0 bg-linear-to-t to-transparent" />
          <div className="via-primary/20 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent" />

          <div className="relative container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="bg-primary/10 ring-primary/20 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
                <Upload className="text-primary h-6 w-6" />
              </div>

              <h2 className="fd-h2 mb-4 text-balance">
                Ready to share files securely?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                No account needed. Files are encrypted in your browser before
                upload and auto-expire for your privacy.
              </p>

              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/">
                    Start sharing now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-muted-foreground text-xs">
                  Free forever · No sign-up
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
