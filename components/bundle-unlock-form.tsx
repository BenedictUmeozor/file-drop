"use client";

import { Eye, EyeOff, Lock, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BundleUnlockFormProps {
  bundleId: string;
  onUnlocked?: () => void;
}

export function BundleUnlockForm({
  bundleId,
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
      const response = await fetch(`/api/bundle/${bundleId}/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ passphrase }),
      });

      if (response.status === 204) {
        // Success - clear passphrase and trigger refresh
        setPassphrase("");
        if (onUnlocked) {
          onUnlocked();
        } else {
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
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Password Protected
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the passphrase to access these files
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="passphrase"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Passphrase
          </label>
          <div className="relative">
            <input
              id="passphrase"
              type={showPassphrase ? "text" : "password"}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              disabled={isSubmitting || retryAfter !== null}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:placeholder-gray-500"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              tabIndex={-1}
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
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
            {error}
            {retryAfter !== null && (
              <p className="mt-1 text-xs">
                Please wait {retryAfter} seconds before trying again.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !passphrase || retryAfter !== null}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Unlock Files
            </>
          )}
        </button>
      </form>
    </div>
  );
}
