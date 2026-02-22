import { api } from "@/convex/_generated/api";
import {
  makeUnlockCookieName,
  signUnlockToken,
} from "@/lib/bundle-unlock-cookie";
import { verifyPassphrase } from "@/lib/passphrase";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const SERVER_TOKEN = process.env.BUNDLE_AUTH_SERVER_TOKEN || "";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Extract client IP address for rate limiting.
 *
 * SECURITY REQUIREMENT: This application MUST be deployed behind a trusted proxy
 * (e.g., Vercel, Cloudflare, AWS ALB) that sets reliable IP headers.
 * Without a trusted proxy, attackers can spoof IP addresses to bypass rate limits.
 *
 * Trusted proxy deployment ensures:
 * - x-real-ip header contains the actual client IP (Vercel)
 * - x-forwarded-for header is sanitized and trustworthy
 * - Intermediate proxies cannot inject false IPs
 *
 * DO NOT deploy this application directly to the internet without a trusted proxy.
 */
function getClientIP(request: NextRequest): string {
  // Prefer Vercel's trusted x-real-ip header
  const realIP = request.headers.get("x-real-ip");
  if (realIP && realIP.trim()) {
    return realIP.trim();
  }

  // Use x-forwarded-for (take FIRST IP which is the actual client)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      // First IP is the actual client, rest are proxies
      return ips[0];
    }
  }

  // Stable fallback for localhost/dev environments
  // Use a stable identifier rather than random per-request
  return "127.0.0.1";
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Bundle ID is required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Parse request body
    let body: { passphrase?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { passphrase } = body;

    if (!passphrase || typeof passphrase !== "string") {
      return NextResponse.json(
        { error: "Passphrase is required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Check if bundle exists and is not expired
    const bundle = await convex.query(api.files.getBundle, { bundleId: id });

    if (!bundle) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (Date.now() > bundle.expiresAt) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!bundle.isPasswordProtected) {
      return NextResponse.json(
        { error: "Bundle is not password protected" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Get client IP for rate limiting
    const ip = getClientIP(request);

    // Check rate limiting (per-IP + per-bundle defense-in-depth)
    // Per-IP: prevents single attacker from brute-forcing
    // Per-bundle: prevents distributed attacks on same bundle
    const rateLimitResult = await convex.mutation(
      api.bundleAuth.recordUnlockAttemptForServer,
      {
        bundleId: id,
        ip,
        serverToken: SERVER_TOKEN,
      }
    );

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimitResult.retryAfterMs / 1000);
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Get the stored hash
    const secret = await convex.query(api.bundleAuth.getBundleSecretForServer, {
      bundleId: id,
      serverToken: SERVER_TOKEN,
    });

    if (!secret || !secret.passphraseHash) {
      return NextResponse.json(
        { error: "Invalid passphrase" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Verify passphrase
    const isValid = await verifyPassphrase(secret.passphraseHash, passphrase);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid passphrase" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Success - set unlock cookie
    const cookieName = makeUnlockCookieName(id);
    const cookieMaxAge = Math.min(
      10 * 60, // 10 minutes
      Math.floor((bundle.expiresAt - Date.now()) / 1000)
    );
    const exp = Date.now() + cookieMaxAge * 1000;
    const token = signUnlockToken({ bundleId: id, exp });

    const response = new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
      },
    });

    // Set HTTP-only secure cookie
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (error) {
    console.error("[Bundle Unlock] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify passphrase" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
