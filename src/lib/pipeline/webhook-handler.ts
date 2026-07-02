import { OpenRouterVisionProvider } from "@/lib/vision/providers/openrouter";
import { validateBusinessCard } from "@/lib/pipeline/validate";
import { storeImage, computeImageHash } from "@/lib/pipeline/image-service";
import { createContact } from "@/lib/contacts/create-contact";
import type { BusinessCard, VisionProvider } from "@/lib/vision/types";

export interface OpenwaWebhookPayload {
  event: string;
  idempotencyKey: string;
  deliveryId: string;
  data: {
    id: string;
    chatId: string;
    from: string;
    type: string;
    body?: string;
    media?: {
      mimetype: string;
      data?: string;
      filename?: string;
      omitted?: boolean;
      sizeBytes?: number;
    };
    isGroup?: boolean;
    author?: string;
    contact?: { pushName?: string };
  };
}

function getImageBuffer(media: NonNullable<OpenwaWebhookPayload["data"]["media"]>): { buffer: Buffer; mimeType: string } | null {
  if (media.data) {
    try {
      const buffer = Buffer.from(media.data, "base64");
      return { buffer, mimeType: media.mimetype || "image/jpeg" };
    } catch {
      return null;
    }
  }
  return null;
}

export function createVisionProvider(): VisionProvider {
  return new OpenRouterVisionProvider();
}

export async function processWebhook(
  payload: OpenwaWebhookPayload,
): Promise<void> {
  const log = (stage: string, extra?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        stage,
        messageId: payload.data.id,
        idempotencyKey: payload.idempotencyKey,
        ...extra,
      }),
    );
  };

  log("webhook_received");

  if (payload.event !== "message.received" || (payload.data.type !== "image" && payload.data.type !== "document")) {
    log("ignored", { reason: "not an image or document message" });
    return;
  }

  if (!payload.data.isGroup) {
    log("ignored", { reason: "not a group message", chatId: payload.data.chatId });
    return;
  }

  const media = payload.data.media;
  if (!media || media.omitted) {
    log("image_unavailable", { reason: media?.omitted ? "media omitted (too large)" : "no media" });
    return;
  }

  log("image_extraction_started");
  const extracted = getImageBuffer(media);
  if (!extracted) {
    log("image_extraction_failed", { reason: "could not decode base64 media" });
    return;
  }
  log("image_extracted", { size: extracted.buffer.length });

  const imageHash = await computeImageHash(extracted.buffer);
  log("image_hash_computed", { hash: imageHash });

  const storedPath = await storeImage(extracted.buffer, extracted.mimeType, payload.data.id);
  if (storedPath) {
    log("image_stored", { path: storedPath });
  }

  log("inference_started");
  let card: BusinessCard;
  try {
    const provider = createVisionProvider();
    card = await provider.extractBusinessCard(extracted.buffer, extracted.mimeType);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("inference_failed", { error: msg });
    return;
  }
  log("inference_completed", { extracted: card });

  const validation = validateBusinessCard(card);
  if (!validation.valid) {
    log("validation_failed", { errors: validation.errors });
    return;
  }
  log("validation_passed");

  const result = await createContact(validation.card, 0.9);
  if ("error" in result) {
    log("contact_insert_failed", { error: result.error });
    return;
  }
  log("contact_inserted", { contactId: result.id });
}