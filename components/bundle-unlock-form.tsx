"use client";

import { AlertCircle, Eye, EyeOff, Lock, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deriveUnlockProof,
  base64UrlToArrayBuffer,
  DEFAULT_PBKDF2_ITERATIONS,
  isWebCryptoAvailable,
} from "@/lib/crypto";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BundleUnlockFormProps {
  bundleId: string;
  isEncrypted?: boolean;
  unlockSaltB64?: string;
  encryptionIterations?: number;
  onUnlocked?: (passphrase: string) => void;
}

export function BundleUnlockForm({
  bundleId,
  isEncrypted = false,
  unlockSaltB64,
  encryptionIterations,
  onUnlocked,
}: BundleUnlockFormProps) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRetryAfter(null);

    if (!passphrase) {
      setError("Please enter a passphrase");
      return;
    }

    setIsSubmitting(true);

    try {
      // SECURITY FIX: For encrypted bundles, derive and send unlockProof instead of passphrase
      let requestBody: { passphrase?: string; unlockProof?: string };
      
      if (isEncrypted) {
        // Guard: salt must be present — without it we cannot derive the proof securely
        if (!unlockSaltB64) {
          setError("Bundle configuration error. Cannot unlock securely.");
          return;
        }
        // Guard: WebCrypto must be available — never fall back to plain passphrase
        if (!isWebCryptoAvailable()) {
          setError(
            "Your browser does not support secure unlock. Please use a modern browser (Chrome, Firefox, Safari, Edge)."
          );
          return;
        }
        // Encrypted bundle: derive unlock proof using zero-knowledge protocol
        const unlockSalt = new Uint8Array(
          base64UrlToArrayBuffer(unlockSaltB64)
        );
        const iterations = encryptionIterations || DEFAULT_PBKDF2_ITERATIONS;
        const unlockProof = await deriveUnlockProof(
          passphrase,
          unlockSalt,
          iterations
        );
        requestBody = { unlockProof };
      } else {
        // Non-encrypted bundle: send passphrase (legacy flow)
        requestBody = { passphrase };
      }

      const response = await fetch(`/api/bundle/${bundleId}/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (response.status === 204) {
        // Success - hand off passphrase to parent AND refresh server chrome
        if (onUnlocked) {
          onUnlocked(passphrase);
          router.refresh(); // Sync header/badges without losing captured passphrase state
        } else {
          setPassphrase("");
          router.refresh();
        }
        return;
      }

      if (response.status === 429) {
        const data = await response.json();
        const retryAfterHeader = response.headers.get("Retry-After");
        const retrySeconds = retryAfterHeader ? parseInt(retryAfterHeader) : 60;
        setRetryAfter(retrySeconds);
        setError(data.error || "Too many attempts. Please try again later.");
        return;
      }

      if (response.status === 401) {
        setError("Invalid passphrase");
        return;
      }

      const data = await response.json();
      setError(data.error || "Failed to verify passphrase");
    } catch (err) {
      console.error("Unlock error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm dark:shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Password Protected
            </CardTitle>
            <CardDescription>Enter the passphrase to access this bundle.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passphrase">Passphrase</Label>
            <div className="relative">
              <Input
                id="passphrase"
                type={showPassphrase ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase"
                disabled={isSubmitting || retryAfter !== null}
                className="pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                aria-pressed={showPassphrase}
              >
                {showPassphrase ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {error}
                {retryAfter !== null && (
                  <span className="mt-1 block">
                    Please wait {retryAfter} seconds before trying again.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/20 p-4">
          <Button
            type="submit"
            disabled={isSubmitting || !passphrase || retryAfter !== null}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Unlock Files
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
