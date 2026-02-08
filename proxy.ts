import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CLEANUP_PROBABILITY = 0.05;

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (Math.random() < CLEANUP_PROBABILITY) {
    const baseUrl = request.nextUrl.origin;

    fetch(`${baseUrl}/api/cleanup`, {
      method: "POST",
      headers: {
        "x-cleanup-trigger": "proxy",
      },
    }).catch(() => {});
  }

  return response;
}

export const config = {
  matcher: ["/", "/share/:path*", "/download/:path*"],
};
