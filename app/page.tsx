"use client";

import { BackgroundDecorations } from "@/components/background-decorations";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UploadZone } from "@/components/upload-zone";
import { Clock, Lock, QrCode, Shield, Sparkles, Zap } from "lucide-react";
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
    title: "Self-destructing",
    description: "Files auto-expire after your chosen time window.",
  },
  {
    icon: Sparkles,
    title: "Zero friction",
    description: "No sign-ups, no apps to install. Just drop and share.",
  },
];

export default function Home() {
  return (
    <>
      <BackgroundDecorations />
      <Header />

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="container mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
          <div className="animate-fade-in-up max-w-2xl space-y-6">
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1.5 text-sm font-medium"
            >
              Secure file sharing
            </Badge>

            <h1 className="text-foreground text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Share files at <span className="gradient-text">warp speed</span>.
            </h1>

            <p className="text-muted-foreground mx-auto max-w-xl text-lg leading-relaxed">
              Secure, serverless file transfer with end-to-end encryption. No
              account required. Files disappear automatically after download or
              expiry.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {trustIndicators.map((item) => (
                <div
                  key={item.label}
                  className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium"
                >
                  <item.icon className="text-primary/70 h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-in-up w-full max-w-2xl [animation-delay:200ms]">
            <UploadZone />
          </div>

          <div className="animate-fade-in-up w-full max-w-3xl pt-4 [animation-delay:400ms]">
            <Separator className="mb-10" />

            <div className="grid grid-cols-2 gap-6 text-left md:grid-cols-4">
              {highlights.map((item) => (
                <div key={item.title} className="group space-y-2">
                  <div className="bg-muted/60 ring-border/60 group-hover:bg-primary/10 group-hover:ring-primary/20 flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition-all duration-300">
                    <item.icon className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors duration-300" />
                  </div>
                  <h3 className="text-[13px] font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center">
              <Link
                href="/how-it-works"
                className="group text-muted-foreground hover:text-foreground relative text-sm font-medium transition-colors"
              >
                See how it works →
                <span className="bg-foreground absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="full" />
    </>
  );
}
