import type { BusinessCard } from "../vision/types";

const EMAIL_RX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_DIGITS_MIN = 7;
const PHONE_DIGITS_MAX = 15;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  card: BusinessCard;
}

export function validateBusinessCard(card: BusinessCard): ValidationResult {
  const errors: string[] = [];

  const emails = card.emails.filter((e) => {
    const clean = e.trim().toLowerCase();
    if (!EMAIL_RX.test(clean)) {
      errors.push(`Invalid email: ${e}`);
      return false;
    }
    return true;
  });

  const phones = card.phones.filter((p) => {
    const digits = p.replace(/\D/g, "");
    if (digits.length < PHONE_DIGITS_MIN || digits.length > PHONE_DIGITS_MAX) {
      errors.push(`Invalid phone number: ${p}`);
      return false;
    }
    return true;
  });

  const hasSignal = !!(
    card.fullName ||
    emails.length > 0 ||
    phones.length > 0 ||
    card.company
  );
  if (!hasSignal) {
    errors.push("No usable data extracted from image");
  }

  return {
    valid: errors.length === 0,
    errors,
    card: {
      fullName: card.fullName?.trim() || null,
      company: card.company?.trim() || null,
      jobTitle: card.jobTitle?.trim() || null,
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
      website: card.website?.trim().toLowerCase() || null,
      address: card.address?.trim() || null,
      linkedin: card.linkedin?.trim() || null,
      notes: card.notes?.trim() || null,
    },
  };
}
