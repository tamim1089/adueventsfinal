import { requireAdmin, listEvents } from "@/lib/admin/db";
import SurveysClient from "./SurveysClient";

export const metadata = { title: "Surveys" };

export default async function Surveys() {
  const { sb } = await requireAdmin();
  const events = await listEvents(sb);

  // Fetch surveys with event info and response count
  const { data: surveysRaw } = await sb
    .from("surveys")
    .select("id, event_id, title, url, created_at")
    .order("created_at", { ascending: false });

  // Fetch response counts per survey
  const { data: responsesRaw } = await sb
    .from("survey_responses")
    .select("survey_id");

  const respCounts: Record<string, number> = {};
  for (const r of responsesRaw ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = r as any;
    respCounts[row.survey_id] = (respCounts[row.survey_id] ?? 0) + 1;
  }

  // Build event name map
  const eventMap: Record<string, string> = {};
  for (const e of events) eventMap[e.id] = e.title;

  const surveys = (surveysRaw ?? []).map((s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = s as any;
    return {
      id: r.id as string,
      event_id: r.event_id as string,
      eventTitle: eventMap[r.event_id] ?? "—",
      title: r.title as string,
      url: (r.url ?? "") as string,
      created_at: r.created_at as string,
      responses: respCounts[r.id] ?? 0,
    };
  });

  const eventsForForm = events.map((e) => ({ id: e.id, title: e.title }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Surveys</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Post-event feedback
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
          Link a survey to any event, then send the link to attendees via Outlook.
        </p>
      </div>

      <SurveysClient surveys={surveys} events={eventsForForm} />
    </div>
  );
}
