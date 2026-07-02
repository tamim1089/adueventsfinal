export interface BusinessCard {
  fullName: string | null;
  company: string | null;
  jobTitle: string | null;
  emails: string[];
  phones: string[];
  website: string | null;
  address: string | null;
  linkedin: string | null;
  notes: string | null;
}

export interface VisionProvider {
  extractBusinessCard(imageBuffer: Buffer, mimeType: string): Promise<BusinessCard>;
}

export interface VisionProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}
