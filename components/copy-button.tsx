"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends ButtonProps {
  text: string;
}

export function CopyButton({ text, className, variant = "outline", size = "icon", ...props }: CopyButtonProps) {
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
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("shrink-0 transition-all", className)}
      type="button"
      {...props}
    >
      {copied ? (
        <Check className="h-4 w-4 text-primary animate-in zoom-in spin-in-90 duration-300" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </Button>
  );
}
