"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-95 ${
        copied
          ? "border-green-600 bg-green-500 text-white shadow-md shadow-green-500/20 dark:border-green-400"
          : "border-slate-200 bg-slate-100 text-slate-700 hover:border-cyan-500/50 hover:bg-white hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-cyan-400"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Copy</span>
        </>
      )}
    </button>
  );
}
