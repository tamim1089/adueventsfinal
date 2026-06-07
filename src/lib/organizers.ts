// The fixed list of ADU organizers. Seed for the DB; also used
// directly by the public landing page (no fetch needed for static chrome).
export type Organizer = {
  slug: string;
  name: string;
  kind: "college" | "department" | "center" | "office";
};

export const ORGANIZERS: Organizer[] = [
  { slug: "engineering", name: "College of Engineering", kind: "college" },
  { slug: "business", name: "College of Business", kind: "college" },
  { slug: "law", name: "College of Law", kind: "college" },
  { slug: "health-sciences", name: "College of Health Sciences", kind: "college" },
  { slug: "arts-education-social", name: "College of Arts, Education & Social Sciences", kind: "college" },
  { slug: "student-affairs", name: "Student Affairs Department", kind: "department" },
  { slug: "admission-registration", name: "Admission & Registration", kind: "department" },
  { slug: "innovation-center", name: "Innovation Center", kind: "center" },
  { slug: "academic-success", name: "Academic Success Center", kind: "center" },
  { slug: "library", name: "Library", kind: "center" },
  { slug: "campus-director", name: "Campus Director Office", kind: "office" },
];
