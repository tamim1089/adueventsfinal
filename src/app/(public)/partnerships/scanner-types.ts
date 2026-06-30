export type ScannedCard = {
  id: string;
  name: string;
  /** Primary email (first in emails[]) */
  email: string | null;
  /** Primary phone (first in phones[]) */
  phone: string | null;
  company: string | null;
  title: string | null;
  website: string | null;
  address: string | null;
  phones: string[];
  emails: string[];
  socials: string[];
  rawText: string;
  /** 0–1 confidence estimate from parseCard() */
  confidence: number;
};
