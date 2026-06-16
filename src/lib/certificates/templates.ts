// Certificate template registry. Geometry calibrated against the converted
// "UDL Module 1 Certificate.docx" (landscape A4 ≈ 842 × 595 pt). The Name and
// description are LEFT-aligned in the ADU template (not centered).

export type CertField = {
  xLeft: number;
  yFromTop: number; // baseline of the first line, measured from the page top
  size: number;
  color: [number, number, number];
  maxWidth: number;
  lineGap: number;
};

export type CertTemplate = {
  key: string;
  basePdf: string; // path relative to project root
  // White rectangle that hides the template's placeholder name + description
  // before we stamp the real values (the region sits on solid white).
  cover: { x: number; y: number; w: number; h: number };
  name: CertField;
  description: CertField;
};

export const CERT_TEMPLATES: Record<string, CertTemplate> = {
  udl: {
    key: "udl",
    basePdf: "public/cert-templates/udl-base.pdf",
    cover: { x: 34, y: 222, w: 686, h: 152 },
    name: {
      xLeft: 50,
      yFromTop: 250,
      size: 28,
      color: [0.949, 0.149, 0.212], // #F22636
      maxWidth: 660,
      lineGap: 32,
    },
    description: {
      xLeft: 41,
      yFromTop: 292,
      size: 15,
      color: [0.1, 0.1, 0.12],
      maxWidth: 660,
      lineGap: 21,
    },
  },
};
