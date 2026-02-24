import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
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

/**
 * HowItWorks Page
 *
 * Implements a clean, documentation-style layout using shadcn/ui components.
 * Removes custom animations and gradients in favor of a semantic,
 * improved readability approach.
 */

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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto flex-1 px-4 py-16 md:py-24">
        {/* Hero Section */}
        <section className="mb-16 space-y-6 text-center md:mb-24 md:text-left text-balance">
          <Badge variant="outline" className="mb-4">
            How it works
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Simple, secure file sharing
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Share files in seconds. No sign-up, no hassle.
            Securely transfer documents, photos, and videos to any device.
          </p>
        </section>

        {/* Steps Section */}
        <section className="mb-16 md:mb-24">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">
            The process
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <Card key={step.number} className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {step.number}
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <step.icon className="h-5 w-5 text-muted-foreground" />
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground/90">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">
            Why FileDrop?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-muted/40">
                <CardHeader>
                  <div className="mb-2 w-fit rounded-md bg-background p-2 ring-1 ring-border">
                    <feature.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <CardTitle className="text-lg">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">Ready to share files securely?</h2>
          <p className="text-muted-foreground mb-6">No account needed. Files are encrypted in your browser before upload.</p>
          <Button asChild size="lg">
            <Link href="/">Start sharing</Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
