import { api } from "@/convex/_generated/api";
import { hashPassphrase } from "@/lib/passphrase";
import { computeUnlockVerifier } from "@/lib/crypto/hmac-verifier";
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
      encryptionData?: {
        isEncrypted: boolean;
        encryptionSaltB64: string;
        encryptionIterations: number;
        encryptionChunkSize: number;
        unlockSaltB64: string;
        unlockProof: string;
      };
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { bundleId, fileCount, totalSize, expiresAt, passphrase, encryptionData } = body;

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

    // SECURITY: Reject passphrase if bundle is E2E encrypted (zero-knowledge requirement)
    if (encryptionData?.isEncrypted && passphrase) {
      return NextResponse.json(
        { error: "Passphrase must not be sent for encrypted bundles" },
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

    // Prepare encryption parameters
    let isEncrypted = false;
    let encryptionSaltB64: string | undefined;
    let encryptionIterations: number | undefined;
    let encryptionChunkSize: number | undefined;
    let unlockSaltB64: string | undefined;
    let unlockVerifierB64: string | undefined;

    if (encryptionData?.isEncrypted) {
      isEncrypted = true;
      encryptionSaltB64 = encryptionData.encryptionSaltB64;
      
      // SECURITY: Validate KDF parameters to prevent abuse
      const MIN_ITERATIONS = 10000;
      const MAX_ITERATIONS = 1000000;
      const ALLOWED_CHUNK_SIZES = [1048576]; // 1MB only for now
      
      encryptionIterations = encryptionData.encryptionIterations;
      if (typeof encryptionIterations !== 'number' || 
          encryptionIterations < MIN_ITERATIONS || 
          encryptionIterations > MAX_ITERATIONS) {
        return NextResponse.json(
          { error: `Invalid encryption iterations: must be between ${MIN_ITERATIONS} and ${MAX_ITERATIONS}` },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }
      
      encryptionChunkSize = encryptionData.encryptionChunkSize;
      if (typeof encryptionChunkSize !== 'number' || 
          !ALLOWED_CHUNK_SIZES.includes(encryptionChunkSize)) {
        return NextResponse.json(
          { error: `Invalid chunk size: must be ${ALLOWED_CHUNK_SIZES.join(' or ')} bytes` },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }
      
      unlockSaltB64 = encryptionData.unlockSaltB64;
      
      // SECURITY: Enforce unlock salt ≠ encryption salt (domain separation)
      if (unlockSaltB64 === encryptionSaltB64) {
        return NextResponse.json(
          { error: "Unlock salt must be different from encryption salt" },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }
      
      // SECURITY FIX: Compute HMAC(serverSecret, unlockProof) instead of storing raw proof
      const serverSecret = process.env.E2E_UNLOCK_VERIFIER_SECRET;
      if (!serverSecret || serverSecret.length < 32) {
        console.error("E2E_UNLOCK_VERIFIER_SECRET not configured or too short");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }
      
      const unlockProof = encryptionData.unlockProof;
      if (!unlockProof || typeof unlockProof !== 'string') {
        return NextResponse.json(
          { error: "Missing unlock proof" },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }
      
      // Compute HMAC verifier (prevents DB compromise from revealing unlock material)
      unlockVerifierB64 = computeUnlockVerifier(unlockProof, serverSecret);
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
      isEncrypted,
      encryptionSaltB64,
      encryptionIterations,
      encryptionChunkSize,
      unlockSaltB64,
      unlockVerifierB64,
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
