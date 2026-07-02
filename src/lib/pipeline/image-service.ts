import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return { buffer: Buffer.from(arrayBuffer), mimeType: contentType };
  } catch {
    return null;
  }
}

export async function storeImage(
  buffer: Buffer,
  mimeType: string,
  waMessageId: string,
): Promise<string | null> {
  const ext = mimeType.split("/")[1] ?? "jpg";
  const path = `scanned-cards/${waMessageId}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("photos")
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    console.error("[image-service] Storage upload error:", error.message);
    return null;
  }

  return path;
}

export async function computeImageHash(buffer: Buffer): Promise<string> {
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
