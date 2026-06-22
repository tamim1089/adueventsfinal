"use client";

import { useState, useTransition } from "react";
import { Plus, Send, Trash2, MessageSquareText, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { createSurvey, deleteSurvey } from "./survey-actions";

type Survey = {
  id: string;
  event_id: string;
  eventTitle: string;
  title: string;
  url: string;
  created_at: string;
  responses: number;
};

type EventOption = { id: string; title: string };

export default function SurveysClient({
  surveys: initial,
  events,
}: {
  surveys: Survey[];
  events: EventOption[];
}) {
  const [surveys, setSurveys] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [formEventId, setFormEventId] = useState(events[0]?.id ?? "");
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleCreate() {
    if (!formEventId || !formTitle.trim()) {
      setFormError("Please fill in event and title.");
      return;
    }
    setFormError("");
    startTransition(async () => {
      const res = await createSurvey(formEventId, formTitle, formUrl);
      if (!res.ok) { setFormError(res.error ?? "Error"); return; }
      setShowForm(false);
      setFormTitle("");
      setFormUrl("");
      // Optimistic: add to local list (will be replaced by server revalidation)
      setSurveys((prev) => [
        {
          id: Date.now().toString(),
          event_id: formEventId,
          eventTitle: events.find((e) => e.id === formEventId)?.title ?? "—",
          title: formTitle,
          url: formUrl,
          created_at: new Date().toISOString(),
          responses: 0,
        },
        ...prev,
      ]);
    });
  }

  function handleDelete(surveyId: string) {
    startTransition(async () => {
      const res = await deleteSurvey(surveyId);
      if (res.ok) setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
    });
  }

  function openOutlookForSurvey(survey: Survey) {
    const subject = encodeURIComponent(`Feedback survey — ${survey.title}`);
    const body = encodeURIComponent(
      `Dear attendee,\n\nThank you for attending "${survey.eventTitle}". We would love to hear your feedback.\n\nPlease fill in our short survey:\n${survey.url || "[paste survey link here]"}\n\nBest regards,\nADU Events Team`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="flex flex-wrap gap-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-5">
        <div>
          <p className="font-mono text-3xl font-semibold tabular-nums text-[var(--text-primary)]">{surveys.length}</p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Surveys</p>
        </div>
        <div>
          <p className="font-mono text-3xl font-semibold tabular-nums text-[var(--accent)]">
            {surveys.reduce((s, v) => s + v.responses, 0)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Total responses</p>
        </div>
      </div>

      {/* Create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--text-tertiary)]">All surveys</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={13} /> New survey
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Add survey</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Event</label>
              <select
                value={formEventId}
                onChange={(e) => setFormEventId(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Survey title</label>
              <input
                type="text"
                placeholder="e.g. Post-event feedback"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-tertiary)]">Survey URL (Google/MS Forms link)</label>
              <input
                type="url"
                placeholder="https://forms.office.com/..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--accent-on)] disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {pending ? "Saving…" : "Save survey"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Survey list */}
      {surveys.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] py-14 text-center">
          <MessageSquareText size={32} className="text-[var(--text-tertiary)]" strokeWidth={1.5} />
          <p className="text-sm text-[var(--text-secondary)]">No surveys yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => {
            const isOpen = expanded[s.id] ?? false;
            return (
              <div
                key={s.id}
                className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)]"
              >
                <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                  <button
                    onClick={() => toggleExpand(s.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronUp size={15} className="shrink-0 text-[var(--text-tertiary)]" />
                    ) : (
                      <ChevronDown size={15} className="shrink-0 text-[var(--text-tertiary)]" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text-primary)]">{s.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {s.eventTitle} · {s.responses} response{s.responses !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                      >
                        <ExternalLink size={11} /> Open
                      </a>
                    )}
                    <button
                      onClick={() => openOutlookForSurvey(s)}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.97]"
                      style={{ background: "var(--accent)" }}
                    >
                      <Send size={11} /> Send
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={pending}
                      className="rounded-full p-1.5 text-[var(--text-tertiary)] transition-colors hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {isOpen && s.url && (
                  <div className="border-t border-[var(--glass-border)] px-5 py-4">
                    <p className="mb-1 text-xs font-medium text-[var(--text-tertiary)]">Survey link</p>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-[var(--accent)] hover:underline"
                    >
                      {s.url}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
