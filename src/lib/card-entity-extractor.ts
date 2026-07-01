import { type ScannedCard } from "@/app/(public)/partnerships/scanner-types";

const EMAIL_RX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RX = /(\+?[\d][\d\s\-().]{5,17}[\d])/;
const URL_RX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/i;
const TITLE_KW_RX = /\b(ceo|coo|cto|cfo|vp|vice|director|manager|engineer|consultant|specialist|president|officer|head|lead|senior|analyst|advisor|professor|founder|partner|dr\.?|chairman|board|executive|principal|architect|coordinator|supervisor|representative|attorney|lawyer|accountant|developer|designer|editor|publisher)\b/i;
const COMPANY_KW_RX = /\b(llc|ltd|inc|corp|co\.|group|holdings|university|institute|authority|ministry|department|company|solutions|services|technologies|global|international|enterprises|industries|partners|consulting|associates|foundation|school|college|corporation|limited|gmbh|saas|agency|studio|lab|labs)\b/i;
const NAME_RX = /^[A-ZÀ-Ö][a-zA-Zà-ö'.\-]+([ ][A-ZÀ-Ö][a-zA-Zà-ö'.\-]+){0,4}$/;
const SOCIAL_RX = /^(linkedin|twitter|x|facebook|instagram|youtube|github|tiktok)[./]/i;
const ADDR_KW_RX = /\b(street|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln|suite|ste|floor|fl|po box|p\.?\s*o\.?\s*box|#\d+|zip|postal)\b/i;

const UAE_PHONE_RX = /(\+?971[\s\-]?\d[\s\-]?\d{3,7}[\s\-]?\d{3,7})|(05[0-9][\s\-]?\d{3}[\s\-]?\d{4})/;

export type WordData = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type LineData = {
  text: string;
  confidence: number;
  words: WordData[];
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

type FieldType = "name" | "title" | "company" | "email" | "phone" | "website" | "address" | "social" | "unknown";

function classifyLine(
  text: string,
  lineIndex: number,
  totalLines: number,
  hasNamePattern: boolean,
): FieldType {
  if (EMAIL_RX.test(text)) return "email";
  if (UAE_PHONE_RX.test(text) || PHONE_RX.test(text)) return "phone";
  if (URL_RX.test(text)) return "website";
  if (SOCIAL_RX.test(text)) return "social";
  if (ADDR_KW_RX.test(text)) return "address";
  if (TITLE_KW_RX.test(text) && lineIndex > 0) return "title";
  if (COMPANY_KW_RX.test(text) && lineIndex > 0) return "company";
  if (hasNamePattern && lineIndex === 0) return "name";
  if (!hasNamePattern && lineIndex === 0 && text.split(/\s+/).length <= 5) return "name";
  return "unknown";
}

export function extractEntities(
  rawText: string,
  words?: WordData[],
  lines?: LineData[],
  totalHeight?: number,
): Omit<ScannedCard, "id" | "rawText" | "confidence"> {
  const analyzedLines: { text: string; field: FieldType; yCenter: number }[] = [];

  if (lines && lines.length > 0 && totalHeight) {
    const sorted = lines
      .filter((l) => l.text.trim().length > 1)
      .sort((a, b) => a.bbox.y0 - b.bbox.y0);

    const total = sorted.length;
    sorted.forEach((line, idx) => {
      const text = line.text.trim();
      const yCenter = (line.bbox.y0 + line.bbox.y1) / 2 / totalHeight;
      const hasName = NAME_RX.test(text);
      analyzedLines.push({
        text,
        field: classifyLine(text, idx, total, hasName),
        yCenter,
      });
    });
  } else {
    const textLines = rawText
      .split("\n")
      .map((l) => l.replace(/\|/g, "").trim())
      .filter((l) => l.length > 2);

    textLines.forEach((text, idx) => {
      const hasName = NAME_RX.test(text);
      analyzedLines.push({
        text,
        field: classifyLine(text, idx, textLines.length, hasName),
        yCenter: idx / textLines.length,
      });
    });
  }

  const emails: string[] = [];
  const phones: string[] = [];
  const socials: string[] = [];
  let name: string | null = null;
  let title: string | null = null;
  let company: string | null = null;
  let website: string | null = null;
  let address: string | null = null;
  const unknownLines: string[] = [];

  const fieldOrder: FieldType[] = [];
  const fieldY: Record<string, number> = {};

  for (const al of analyzedLines) {
    switch (al.field) {
      case "email":
        const em = al.text.match(EMAIL_RX);
        if (em && !emails.includes(em[0].toLowerCase())) {
          emails.push(em[0].toLowerCase());
          fieldOrder.push("email");
          fieldY["email"] = al.yCenter;
        }
        break;
      case "phone": {
        const uaeMatch = al.text.match(UAE_PHONE_RX);
        const phMatch = al.text.match(PHONE_RX);
        const p = uaeMatch?.[0] ?? phMatch?.[0] ?? null;
        if (p) {
          const cleaned = p.trim();
          if (cleaned.replace(/\D/g, "").length >= 7 && !phones.includes(cleaned)) {
            phones.push(cleaned);
            fieldOrder.push("phone");
            fieldY["phone"] = al.yCenter;
          }
        }
        break;
      }
      case "website":
        if (!website) {
          website = al.text;
          fieldOrder.push("website");
          fieldY["website"] = al.yCenter;
        }
        break;
      case "social":
        if (!socials.includes(al.text)) socials.push(al.text);
        break;
      case "title":
        if (!title) {
          title = al.text;
          fieldOrder.push("title");
          fieldY["title"] = al.yCenter;
        }
        break;
      case "company":
        if (!company) {
          company = al.text;
          fieldOrder.push("company");
          fieldY["company"] = al.yCenter;
        }
        break;
      case "address":
        if (!address) {
          address = al.text;
          fieldOrder.push("address");
          fieldY["address"] = al.yCenter;
        }
        break;
      case "name":
        if (!name) {
          name = al.text;
          fieldOrder.push("name");
          fieldY["name"] = al.yCenter;
        }
        break;
      default:
        unknownLines.push(al.text);
    }
  }

  if (!name && unknownLines.length > 0) {
    for (const ul of unknownLines) {
      if (NAME_RX.test(ul) && ul.split(/\s+/).length <= 5) {
        name = ul;
        break;
      }
    }
  }

  if (!name) {
    const all = analyzedLines.map((l) => l.text);
    name = all[0] ?? "Unknown";
  }

  if (!title && unknownLines.length > 0) {
    for (const ul of unknownLines) {
      if (TITLE_KW_RX.test(ul)) {
        title = ul;
        break;
      }
    }
  }

  if (!company && unknownLines.length > 0) {
    for (const ul of unknownLines) {
      if (COMPANY_KW_RX.test(ul)) {
        company = ul;
        break;
      }
    }
  }

  return {
    name: name.trim(),
    email: emails[0] ?? null,
    phone: phones[0] ?? null,
    company,
    title,
    website,
    address,
    emails,
    phones,
    socials,
  };
}

export function hasSignal(
  card: Omit<ScannedCard, "id" | "rawText" | "confidence">,
): boolean {
  return !!(card.email || card.phone);
}

let nerPipeline: any = null;
let nerLoading = false;

export async function warmNerModel() {
  if (nerPipeline || nerLoading) return;
  nerLoading = true;
  try {
    const { pipeline } = await import("@huggingface/transformers");
    nerPipeline = await pipeline("token-classification", "Xenova/bert-base-NER");
  } catch {
    nerPipeline = null;
  } finally {
    nerLoading = false;
  }
}

export async function refineWithNER(
  rawText: string,
  extracted: Omit<ScannedCard, "id" | "rawText" | "confidence">,
): Promise<Omit<ScannedCard, "id" | "rawText" | "confidence">> {
  if (!nerPipeline) {
    try {
      await warmNerModel();
    } catch {
      return extracted;
    }
  }
  if (!nerPipeline) return extracted;

  try {
    const result = await nerPipeline(rawText);
    const entities = result as Array<{
      entity_group: string;
      word: string;
      score: number;
    }>;

    const persons: string[] = [];
    const orgs: string[] = [];
    for (const e of entities) {
      if (e.entity_group === "PER" && e.score > 0.8) persons.push(e.word);
      if (e.entity_group === "ORG" && e.score > 0.7) orgs.push(e.word);
    }

    const updated = { ...extracted };

    if (persons.length > 0 && (!extracted.name || extracted.name === "Unknown")) {
      updated.name = persons.join(" ");
    }

    if (orgs.length > 0 && !extracted.company) {
      updated.company = orgs.join(" ");
    }

    return updated;
  } catch {
    return extracted;
  }
}
