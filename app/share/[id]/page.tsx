import { CopyButton } from "@/components/copy-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QRCode } from "@/components/qr-code";
import {
  FileIcon,
  Files,
  Lock,
  Share2,
  AlertCircle,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
  uploadThingUrl: string;
}

interface BundleMetadata {
  bundleId: string;
  fileCount: number;
  totalSize: number;
  createdAt: number;
  expiresAt: number;
  isPasswordProtected: boolean;
  files: FileMetadata[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function getBundleMetadata(id: string): Promise<BundleMetadata | null> {
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
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch bundle metadata:", error);
    return null;
  }
}

function getBaseUrl(headersList: Awaited<ReturnType<typeof headers>>): string {
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const metadata = await getBundleMetadata(id);
  const headersList = await headers();
  const baseUrl = getBaseUrl(headersList);
  const shareUrl = `${baseUrl}/download/${id}`;

  if (!metadata) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle>Files Not Found</CardTitle>
              <CardDescription>
                This bundle may have expired or been deleted.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Share2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">
              {metadata.fileCount > 1
                ? "Files Ready to Share"
                : "File Ready to Share"}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              Share the link below or scan the QR code to download.
              {metadata.isPasswordProtected && (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Lock className="h-3 w-3" />
                  Protected
                </Badge>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* File List */}
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Files className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {metadata.fileCount} {metadata.fileCount > 1 ? "files" : "file"}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(metadata.totalSize)}
                  </span>
                </div>
              </div>
              
              <div className="max-h-48 overflow-y-auto pr-2">
                {metadata.files.map((file, index) => (
                  <div key={file.fileId}>
                    {index > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between py-1 text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.filename}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground ml-4">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
               {/* Share Link */}
              <div className="space-y-4">
                <div className="space-y-2">
                   <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Share Link</div>
                   <div className="flex items-center gap-2">
                    <Input 
                      value={shareUrl} 
                      readOnly 
                      className="font-mono text-xs" 
                    />
                    <CopyButton text={shareUrl} />
                   </div>
                </div>
                
                 <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                       <span>Expires in:</span>
                       <CountdownTimer expiresAt={new Date(metadata.expiresAt).toISOString()} />
                    </div>
                    {metadata.isPasswordProtected && (
                         <div className="flex items-center gap-2">
                           <Lock className="h-3 w-3" />
                           <span>Password required for download</span>
                         </div>
                    )}
                 </div>
              </div>

               {/* QR Code */}
              <div className="flex flex-col items-center justify-start gap-2">
                <QRCode url={shareUrl} size={140} className="border-2" />
                <span className="text-xs text-muted-foreground">Scan to download</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t bg-muted/20 p-6">
             <Button variant="ghost" asChild>
                <Link href="/">Upload more files</Link>
             </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
