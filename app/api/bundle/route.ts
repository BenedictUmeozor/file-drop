import { api } from "@/convex/_generated/api";
import { hashPassphrase } from "@/lib/passphrase";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    let body: {
      bundleId: string;
      fileCount: number;
      totalSize: number;
      createdAt?: number; // Now optional, will be set server-side
      expiresAt: number;
      passphrase?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { bundleId, fileCount, totalSize, expiresAt, passphrase } = body;

    // Validate required fields
    if (
      !bundleId ||
      typeof fileCount !== "number" ||
      typeof totalSize !== "number" ||
      typeof expiresAt !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Validate bundleId format (NanoID pattern)
    const bundleIdPattern = /^[A-Za-z0-9_-]{12}$/;
    if (!bundleIdPattern.test(bundleId)) {
      return NextResponse.json(
        { error: "Invalid bundleId format" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Set createdAt server-side
    const createdAt = Date.now();

    // Validate expiresAt against allowed window (max 7 days from now)
    const maxExpiresAt = createdAt + 7 * 24 * 60 * 60 * 1000; // 7 days
    if (expiresAt < createdAt) {
      return NextResponse.json(
        { error: "Expiration date must be in the future" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (expiresAt > maxExpiresAt) {
      return NextResponse.json(
        { error: "Expiration date cannot exceed 7 days from now" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Validate passphrase if provided
    if (passphrase !== undefined) {
      if (typeof passphrase !== "string") {
        return NextResponse.json(
          { error: "Passphrase must be a string" },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }

      if (passphrase.length > 0 && passphrase.length < 8) {
        return NextResponse.json(
          { error: "Passphrase must be at least 8 characters" },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }

      if (passphrase.length > 128) {
        return NextResponse.json(
          { error: "Passphrase must be at most 128 characters" },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    // Hash passphrase if provided and not empty
    let passphraseHash: string | undefined;
    if (passphrase && passphrase.length > 0) {
      passphraseHash = await hashPassphrase(passphrase);
    }

    // Create bundle in Convex
    const id = await convex.mutation(api.files.createBundle, {
      bundleId,
      fileCount,
      totalSize,
      createdAt,
      expiresAt,
      passphraseHash,
      serverToken: process.env.BUNDLE_AUTH_SERVER_TOKEN || "",
    });

    return NextResponse.json(
      {
        success: true,
        bundleId,
        id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Bundle Create] Error:", error);
    return NextResponse.json(
      { error: "Failed to create bundle" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
