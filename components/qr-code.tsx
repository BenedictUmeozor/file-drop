"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeProps {
  url: string;
  size?: number;
}

export function QRCode({ url, size = 200 }: QRCodeProps) {
  return (
    <div className="inline-flex rounded-xl bg-white p-4 shadow-sm">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
