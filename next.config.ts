import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Stricter CSP for all pages including upload (/)
        // WARNING: 'unsafe-inline' for scripts is kept for Next.js compatibility
        // This allows XSS if user input is not properly sanitized
        // TODO: Implement nonce-based CSP for true XSS protection
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // SECURITY WARNING: unsafe-inline allows inline scripts (XSS risk)
              // Kept for Next.js compatibility; use nonces for production hardening
              process.env.NODE_ENV === "production"
                ? "script-src 'self' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://utfs.io https://*.utfs.io https://uploadthing.com https://*.uploadthing.com https://ingest.uploadthing.com https://*.convex.cloud wss://*.convex.cloud",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
