"use client";

import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCode({ url, size = 160, className }: QRCodeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg border bg-white p-4 shadow-sm dark:shadow-none",
        className
      )}
    >
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        marginSize={0}
        bgColor="white"
        fgColor="black"
      />
    </div>
  );
}

