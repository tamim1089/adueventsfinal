import { NextResponse } from "next/server";
import { processWebhook, type OpenwaWebhookPayload } from "@/lib/pipeline/webhook-handler";
import crypto from "node:crypto";

export const runtime = "nodejs";

function verifySignature(payload: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return true;
  const secret = process.env.OPENWA_WEBHOOK_SECRET;
  if (!secret) return true;

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;
  const receivedSig = signatureHeader.slice(prefix.length);

  const computed = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (receivedSig.length !== computed.length) return false;
  return crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(computed));
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-openwa-signature");
  if (!verifySignature(rawBody, signature)) {
    console.warn("[openwa-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: OpenwaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  processWebhook(payload).catch((err) => {
    console.error("[openwa-webhook] Async processing error:", err);
  });

  return NextResponse.json({ received: true });
}
