import { type ScannedCard } from "./scanner-types";

const EMAIL_RX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const EMAIL_LABEL_RX = /^(e-?mail|e\b)\s*[:;.]?\s*$/i;
const PHONE_RX = /(\+?[\d][\d\s\-().]{5,17}[\d])/;
const PHONE_LABEL_RX = /^(phone|mobile|mob|tel|telephone|cell|whatsapp)\s*[:;.]?\s*$/i;
const URL_RX = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/i;
const WEBSITE_LABEL_RX = /^(web|website|url|https?:\/\/)\s*[:;.]?\s*$/i;

const TITLE_KW_RX = /\b(ceo|coo|cto|cfo|vp\b|vice\s+president|director|manager|engineer|consultant|specialist|officer|head\s+of|lead\s|senior|analyst|advisor|professor|founder|partner|dr\.?|chairman|board\s+member|executive|principal|architect|coordinator|supervisor|president|attorney|accountant|developer|designer|editor|publisher|associate|assistant|chief\s)\b/i;

const COMPANY_KW_RX = /\b(llc|ltd|inc|corp|co\.|group|holdings|university|institute|authority|ministry|department|company|solutions|services|technologies|global|international|enterprises|industries|partners|consulting|associates|foundation|school|college|corporation|limited|gmbh|saas|agency|studio|labs?|centre|center|bureau|council|society|organization|organisation|club)\b/i;

const ADDRESS_RX = /^(no\.|#|p\.?\s*o\.?\s*(box)?|building|floor|room|suite|unit|office|street|st\.|road|rd\.|avenue|ave\.|lane|drive|dr\.|block|tower|villa|plot)\b/i;
const ADDRESS_NUM_RX = /\b\d+\s+[a-zA-Z]/;

const SOCIAL_RX = /\b(linkedin|twitter|x\.com|facebook|instagram|youtube|github|tiktok|telegram|snapchat|whatsapp)\b/i;

const NAME_LIKE_RX = /^[A-ZÀ-Ö][a-zA-Zà-ö'.\-]+([ ][A-ZÀ-Ö][a-zA-Zà-ö'.\-]+){0,4}$/;

function classifyLine(line: string): string {
  if (line.length < 2) return "empty";

  const trimmed = line.trim();

  if (URL_RX.test(trimmed)) return "website";
  if (SOCIAL_RX.test(trimmed)) return "social";
  if (EMAIL_RX.test(trimmed)) return "email";
  if (EMAIL_LABEL_RX.test(trimmed)) return "email_label";
  if (WEBSITE_LABEL_RX.test(trimmed)) return "website_label";
  if (PHONE_LABEL_RX.test(trimmed)) return "phone_label";

  const hasDigits = /\d/.test(trimmed);
  const hasLetters = /[a-zA-Z]/.test(trimmed);

  if (PHONE_RX.test(trimmed) && hasDigits && !hasLetters) return "phone";
  if (PHONE_RX.test(trimmed)) return "phone_mixed";
  if (ADDRESS_RX.test(trimmed) || (hasDigits && /\b(st|rd|ave|dr|ln|blvd|hwy|box|suite|floor|room|apt)\b/i.test(trimmed))) return "address";

  if (!hasDigits && COMPANY_KW_RX.test(trimmed)) return "company";
  if (!hasDigits && TITLE_KW_RX.test(trimmed)) return "title";
  if (!hasDigits && trimmed === trimmed.toUpperCase() && trimmed.length > 3) return "company_upper";
  if (NAME_LIKE_RX.test(trimmed) && !hasDigits) return "name_candidate";

  if (ADDRESS_NUM_RX.test(trimmed)) return "address";

  return "other";
}

function scoreName(lines: string[], idx: number): number {
  const line = lines[idx].trim();
  let score = 0;

  if (NAME_LIKE_RX.test(line)) score += 30;
  if (idx === 0) score += 20;
  if (idx < lines.length / 3) score += 10;
  if (/[A-Z]/.test(line[0])) score += 10;
  if (line.length < 30) score += 5;
  if (!/\d/.test(line)) score += 5;
  if (line.split(/\s+/).length <= 4) score += 5;
  if (line.length > 2) score += 3;

  if (COMPANY_KW_RX.test(line)) score -= 20;
  if (TITLE_KW_RX.test(line)) score -= 15;
  if (line.includes(",")) score -= 5;
  if (line.length > 40) score -= 10;
  if (/[a-z]/.test(line[0])) score -= 5;

  return score;
}

function scoreCompany(lines: string[], idx: number): number {
  const line = lines[idx].trim();
  let score = 0;

  if (COMPANY_KW_RX.test(line)) score += 30;
  if (line === line.toUpperCase() && line.length > 3) score += 25;
  if (idx > 0 && idx < lines.length - 1) score += 10;
  if (line.length > 5) score += 5;
  if (/\d/.test(line)) score -= 5;
  if (NAME_LIKE_RX.test(line) && !COMPANY_KW_RX.test(line)) score -= 20;

  return score;
}

function scoreTitle(lines: string[], idx: number): number {
  const line = lines[idx].trim();
  let score = 0;

  if (TITLE_KW_RX.test(line)) score += 30;
  if (idx > 0 && idx < lines.length - 1) score += 10;
  if (idx === 1 && lines.length > 2) score += 15;
  if (line.length < 30) score += 5;
  if (/\d/.test(line)) score -= 10;
  if (COMPANY_KW_RX.test(line)) score -= 15;

  return score;
}

export function parseCardText(
  rawText: string,
  multiPassTexts?: string[],
): Partial<ScannedCard> {
  const textsToParse = multiPassTexts && multiPassTexts.length > 0
    ? multiPassTexts
    : [rawText];

  const allLines: string[] = [];
  for (const t of textsToParse) {
    for (const line of t.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length > 1) allLines.push(trimmed);
    }
  }

  const uniqueLines = [...new Set(allLines)];

  const emails: string[] = [];
  const phones: string[] = [];
  const socials: string[] = [];
  let website: string | null = null;
  let address: string | null = null;

  const textBlock = rawText;

  const emailMatches = textBlock.match(EMAIL_RX);
  if (emailMatches) {
    for (const m of emailMatches) {
      const clean = m.toLowerCase();
      if (!emails.includes(clean)) emails.push(clean);
    }
  }

  const phoneMatches = textBlock.match(PHONE_RX);
  if (phoneMatches) {
    for (const m of phoneMatches) {
      const clean = m.trim();
      const digits = clean.replace(/\D/g, "");
      if (digits.length >= 7 && digits.length <= 15) {
        if (!phones.includes(clean)) phones.push(clean);
      }
    }
  }

  const urlMatches = textBlock.match(URL_RX);
  if (urlMatches) {
    website = urlMatches[0].toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  }

  const socialMatches = textBlock.match(SOCIAL_RX);
  if (socialMatches) {
    for (const m of socialMatches) {
      if (!socials.includes(m.toLowerCase())) socials.push(m.toLowerCase());
    }
  }

  const classified: { line: string; type: string; score: number }[] = [];
  for (let i = 0; i < uniqueLines.length; i++) {
    const type = classifyLine(uniqueLines[i]);
    let score = 0;
    switch (type) {
      case "name_candidate": score = scoreName(uniqueLines, i); break;
      case "company":
      case "company_upper":  score = scoreCompany(uniqueLines, i); break;
      case "title":          score = scoreTitle(uniqueLines, i); break;
    }
    classified.push({ line: uniqueLines[i], type, score });
  }

  const nonContact = classified.filter(
    (c) => !["email", "phone", "phone_mixed", "website", "social", "address", "email_label", "phone_label", "website_label", "empty"].includes(c.type),
  );

  let name: string | null = null;
  let company: string | null = null;
  let title: string | null = null;

  const nameCandidates = nonContact
    .filter((c) => c.type === "name_candidate")
    .sort((a, b) => b.score - a.score);

  if (nameCandidates.length > 0) {
    name = nameCandidates[0].line;
  }

  const companyCandidates = nonContact
    .filter((c) => c.type === "company" || c.type === "company_upper")
    .sort((a, b) => b.score - a.score);

  if (companyCandidates.length > 0) {
    company = companyCandidates[0].line;
  }

  const titleCandidates = nonContact
    .filter((c) => c.type === "title")
    .sort((a, b) => b.score - a.score);

  if (titleCandidates.length > 0) {
    title = titleCandidates[0].line;
  }

  const confidence = computeConfidence(name, emails, phones, company);

  return {
    id: crypto.randomUUID(),
    name: name ?? "Unknown",
    email: emails[0] ?? null,
    phone: phones[0] ?? null,
    company,
    title,
    website,
    address,
    phones,
    emails,
    socials,
    rawText: rawText,
    confidence,
  };
}

function computeConfidence(
  name: string | null,
  emails: string[],
  phones: string[],
  company: string | null,
): number {
  let score = 0;

  if (name && name !== "Unknown") score += 30;
  if (emails.length > 0) score += 25;
  if (phones.length > 0) score += 25;
  if (company) score += 20;

  return Math.min(99, score);
}

export function fuseScans(results: Partial<ScannedCard>[]): Partial<ScannedCard> {
  if (results.length === 0) return { id: crypto.randomUUID(), name: "Unknown", confidence: 0 };

  const nameVotes = new Map<string, number>();
  const companyVotes = new Map<string, number>();
  const titleVotes = new Map<string, number>();
  const emailSet = new Set<string>();
  const phoneSet = new Set<string>();
  const socialSet = new Set<string>();
  const allTexts: string[] = [];
  let bestConfidence = 0;

  for (const r of results) {
    if (r.name && r.name !== "Unknown") {
      nameVotes.set(r.name, (nameVotes.get(r.name) ?? 0) + 1);
    }
    if (r.company) {
      companyVotes.set(r.company, (companyVotes.get(r.company) ?? 0) + 1);
    }
    if (r.title) {
      titleVotes.set(r.title, (titleVotes.get(r.title) ?? 0) + 1);
    }
    if (r.email) emailSet.add(r.email);
    if (r.phone) phoneSet.add(r.phone);
    if (r.socials) r.socials.forEach((s) => socialSet.add(s));
    if (r.rawText) allTexts.push(r.rawText);
    if (r.confidence && r.confidence > bestConfidence) {
      bestConfidence = r.confidence;
    }
  }

  const pickBest = (votes: Map<string, number>): string | null => {
    let best = null, bestCount = 0;
    for (const [value, count] of votes) {
      if (count > bestCount) { bestCount = count; best = value; }
    }
    return best;
  };

  return {
    id: crypto.randomUUID(),
    name: pickBest(nameVotes) ?? "Unknown",
    email: emailSet.values().next().value ?? null,
    phone: phoneSet.values().next().value ?? null,
    company: pickBest(companyVotes) ?? null,
    title: pickBest(titleVotes) ?? null,
    website: null,
    address: null,
    emails: [...emailSet],
    phones: [...phoneSet],
    socials: [...socialSet],
    rawText: allTexts.join("\n---\n"),
    confidence: Math.min(99, bestConfidence + nameVotes.size * 10),
  };
}
