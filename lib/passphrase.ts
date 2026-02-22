import * as argon2 from "argon2";

/**
 * Hashes a passphrase using Argon2id.
 * Returns an encoded hash string that includes salt and parameters.
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  return argon2.hash(passphrase, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3, // iterations
    parallelism: 1,
  });
}

/**
 * Verifies a passphrase against a stored hash.
 * Returns true if the passphrase matches.
 */
export async function verifyPassphrase(
  hash: string,
  passphrase: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, passphrase);
  } catch (error) {
    console.error("Passphrase verification error:", error);
    return false;
  }
}
