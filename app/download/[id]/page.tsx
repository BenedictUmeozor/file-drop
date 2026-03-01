import { DownloadPageContent } from "@/components/download-page-content";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Clock, CloudUpload } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FileMetadata {
  fileId: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: number;
  expiresAt: number;
  uploadThingUrl?: string;
  downloadUrl?: string;
  isEncrypted?: boolean;
  encryptedMetadataB64?: string;
  encryptedMetadataIvB64?: string;
  wrappedDekB64?: string;
  wrappedDekIvB64?: string;
  baseNonceB64?: string;
  originalSize?: number;
}

interface BundleMetadata {
  bundleId: string;
  fileCount: number;
  totalSize: number;
  createdAt: number;
  expiresAt: number;
  isPasswordProtected: boolean;
  isUnlocked: boolean;
  files: FileMetadata[];
  isEncrypted?: boolean;
  encryptionSaltB64?: string;
  encryptionIterations?: number;
  encryptionChunkSize?: number;
  unlockSaltB64?: string;
}

interface BundleError {
  error: string;
  status: number;
}

async function getBundleMetadata(
  id: string,
): Promise<{ data: BundleMetadata | null; error: BundleError | null }> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const cookieHeader = headersList.get("cookie");

    const response = await fetch(`${protocol}://${host}/api/bundle/${id}`, {
      cache: "no-store",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      return {
        data: null,
        error: { error: errorData.error, status: response.status },
      };
    }

    return { data: await response.json(), error: null };
  } catch (error) {
    console.error("Failed to fetch bundle metadata:", error);
    return {
      data: null,
      error: { error: "Failed to fetch files", status: 500 },
    };
  }
}

export default async function DownloadPage({ params }: PageProps) {
  const { id } = await params;
  const { data: metadata, error } = await getBundleMetadata(id);
  const isExpired = error?.status === 410;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <section
          className={
            metadata
              ? "mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20"
              : "mx-auto w-full max-w-6xl px-4 py-12 md:px-6"
          }
        >
          {metadata ? (
            <DownloadPageContent metadata={metadata} bundleId={id} />
          ) : (
            <Card className="mx-auto w-full max-w-md shadow-sm dark:shadow-none">
              <CardHeader className="items-center text-center">
                <div className="bg-destructive/10 border-destructive/20 mb-2 flex h-10 w-10 items-center justify-center rounded-md border">
                  {isExpired ? (
                    <Clock
                      className="text-destructive h-5 w-5"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="text-destructive h-5 w-5"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <h1 className="text-2xl font-semibold tracking-tight leading-none">
                  {isExpired ? "Link Expired" : "Bundle Not Found"}
                </h1>
                <CardDescription>
                  {isExpired
                    ? "This transfer link has expired and the files were permanently removed."
                    : "We could not find this bundle. It may have expired, been deleted, or the link may be incorrect."}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-3 pt-0 sm:flex-row sm:justify-center">
                {isExpired && (
                  <Button asChild size="lg">
                    <Link href="/">
                      <CloudUpload className="mr-2 h-4 w-4" />
                      Start New Transfer
                    </Link>
                  </Button>
                )}
                <Button variant={isExpired ? "outline" : "default"} asChild size="lg">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
