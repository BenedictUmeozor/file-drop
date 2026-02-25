import { BackgroundDecorations } from "@/components/background-decorations";
import { DownloadPageContent } from "@/components/download-page-content";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CloudUpload, XCircle } from "lucide-react";
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
    <>
      <BackgroundDecorations />
      <Header />

      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16">
        {metadata ? (
          <DownloadPageContent metadata={metadata} bundleId={id} />
        ) : isExpired ? (
          <div className="animate-fade-in-up flex flex-col items-center text-center">
            <div className="bg-muted ring-border/60 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1">
              <Clock className="text-muted-foreground h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Link Expired</h1>
            <p className="text-muted-foreground mt-2 max-w-sm">
              This transfer link has expired and the files have been permanently
              deleted from our servers.
            </p>

            <Button asChild className="mt-8" size="lg">
              <Link href="/">
                <CloudUpload className="mr-2 h-4 w-4" />
                Start New Transfer
              </Link>
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in-up flex flex-col items-center text-center">
            <div className="bg-destructive/10 ring-destructive/20 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1">
              <XCircle className="text-destructive h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Bundle Not Found
            </h1>
            <p className="text-muted-foreground mt-2 max-w-sm">
              We couldn&apos;t find the files you&apos;re looking for. They may
              have been deleted or the link is incorrect.
            </p>

            <Button variant="outline" asChild className="mt-8" size="lg">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
