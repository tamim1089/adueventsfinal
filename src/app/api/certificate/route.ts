import { NextResponse } from "next/server";
import { EVENTS_DATA } from "@/lib/events-data";
import { renderCertificatePdf, defaultCertificateDescription } from "@/lib/certificates/generate";

// pdf-lib + fs need the Node runtime (not edge).
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const slug = String(body?.slug ?? "").trim();

  if (!name) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  const event = [...EVENTS_DATA.upcoming, ...EVENTS_DATA.past].find((e) => e.slug === slug);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const description = defaultCertificateDescription({
    eventTitle: event.title,
    organizer: event.organizer,
    when: event.when,
  });

  const pdf = await renderCertificatePdf({ templateKey: "udl", name, description });

  const safe = name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "recipient";
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ADU-Certificate-${safe}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
