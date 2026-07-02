import "server-only";
import { type VisionProvider, type BusinessCard, type VisionProviderConfig } from "../types";
import { SYSTEM_PROMPT } from "../prompt";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

function defaultConfig(): VisionProviderConfig {
  return {
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    model: process.env.OPENROUTER_MODEL ?? "qwen/qwen3-vl-8b-instruct",
  };
}

export class OpenRouterVisionProvider implements VisionProvider {
  private config: VisionProviderConfig;

  constructor(config?: Partial<VisionProviderConfig>) {
    this.config = { ...defaultConfig(), ...config };
  }

  async extractBusinessCard(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<BusinessCard> {
    const base64 = imageBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    const response = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://adu-al-ain.events",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract business card information from this image." },
              { type: "image_url", image_url: { url: dataUri } },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}${body ? ` — ${body.slice(0, 500)}` : ""}`,
      );
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter returned no content in response");
    }

    return this.parseResponse(content);
  }

  private parseResponse(content: string): BusinessCard {
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse OpenRouter response as JSON");
    }

    const asArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === "string" && v) return [v];
      return [];
    };

    return {
      fullName: parsed.fullName ? String(parsed.fullName) : null,
      company: parsed.company ? String(parsed.company) : null,
      jobTitle: parsed.jobTitle ? String(parsed.jobTitle) : null,
      emails: asArray(parsed.emails).map((e) => e.toLowerCase()),
      phones: asArray(parsed.phones),
      website: parsed.website ? String(parsed.website).replace(/^https?:\/\//, "").replace(/^www\./, "") : null,
      address: parsed.address ? String(parsed.address) : null,
      linkedin: parsed.linkedin ? String(parsed.linkedin) : null,
      notes: parsed.notes ? String(parsed.notes) : null,
    };
  }
}
