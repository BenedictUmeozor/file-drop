"use client";

import { BackgroundDecorations } from "@/components/background-decorations";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { UploadZone } from "@/components/upload-zone";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <>
      <BackgroundDecorations />
      <Header />

      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 pt-24 pb-12">
        <div className="container mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
          
          <div className="animate-fade-in-up mt-8 max-w-2xl space-y-6">
            <Badge variant="outline" className="rounded-full py-1.5 px-4 text-sm font-medium">
              Secure file sharing
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Share files at <span className="text-primary">warp speed</span>.
            </h1>

            <p className="text-lg leading-relaxed text-muted-foreground mx-auto max-w-xl">
              Secure, serverless p2p file transfer. No account required. Files
              disappear automatically after download or expiry.
            </p>
          </div>

          <div className="w-full max-w-2xl animate-fade-in-up [animation-delay:200ms]">
            <UploadZone />
          </div>
          
        </div>
      </main>

      <Footer variant="full" />
    </>
  );
}
