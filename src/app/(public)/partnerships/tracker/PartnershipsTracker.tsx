"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Save, X, Edit2, Trash2, Loader2, FileText, Briefcase, Phone, Mail, MessageSquare, CheckCircle2, ExternalLink } from "lucide-react";
import { updatePartnershipTracker, updatePartnershipTrackerNotes, updatePartnershipTrackerUpdates, deletePartnershipTracker, addPartnershipTracker, type PartnershipTrackerItem } from "./actions";

export default function PartnershipsTracker() {
  const [items, setItems] = useState<PartnershipTrackerItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PartnershipTrackerItem>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState<Partial<PartnershipTrackerItem>>({});
  const [isPending, startTransition] = useTransition();
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const fetchItems = () => {
    const sb = createClient();
    sb
      .from("partnerships_tracker")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as PartnershipTrackerItem[]);
      });
  };

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    const sb = createClient();

    const mapRow = (row: Record<string, unknown>): PartnershipTrackerItem => ({
      id: row.id as string,
      name: row.name as string,
      position: row.position as string | null,
      contact: row.contact as string | null,
      notes: row.notes as string | null,
      to_be_done: row.to_be_done as string | null,
      updates: row.updates as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    });

    const channel = sb
      .channel("partnerships-tracker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "partnerships_tracker" },
        (payload: { new: Record<string, unknown> }) => {
          if (payload.new) {
            const item = mapRow(payload.new);
            setItems((prev) => prev.some(i => i.id === item.id) ? prev : [item, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "partnerships_tracker" },
        (payload: { new: Record<string, unknown> }) => {
          if (payload.new) {
            const updated = mapRow(payload.new);
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "partnerships_tracker" },
        (payload: { old: Record<string, unknown> }) => {
          if (payload.old) {
            const deletedId = payload.old.id as string;
            setItems((prev) => prev.filter((i) => i.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => { void sb.removeChannel(channel); };
  }, []);

  const startEdit = useCallback((item: PartnershipTrackerItem) => {
    setEditingId(item.id);
    setEditDraft({ ...item });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft({});
  }, []);

  const saveEdit = useCallback(async (id: string) => {
    setSavingIds(prev => new Set(prev).add(id));
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(editDraft).forEach(([k, v]) => formData.append(k, v as string));
      const res = await updatePartnershipTracker(id, formData);
      if (res.error) alert(res.error);
      else { setEditingId(null); setEditDraft({}); }
      setSavingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    });
  }, [editDraft]);

  const saveNotes = useCallback(async (id: string, notes: string) => {
    startTransition(async () => {
      const res = await updatePartnershipTrackerNotes(id, notes);
      if (res.error) alert(res.error);
    });
  }, []);

  const saveUpdates = useCallback(async (id: string, updates: string) => {
    startTransition(async () => {
      const res = await updatePartnershipTrackerUpdates(id, updates);
      if (res.error) alert(res.error);
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    startTransition(async () => {
      const res = await deletePartnershipTracker(id);
      if (res.error) alert(res.error);
    });
  }, []);

  const handleAddSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addPartnershipTracker(formData);
      if (res.error) alert(res.error);
      else { setShowAdd(false); setAddDraft({}); fetchItems(); }
    });
  }, []);

  const handleAddChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddDraft(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditDraft(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

  return (
    <section className="border-t border-[var(--glass-border)] bg-[var(--bg-base)]" aria-labelledby="tracker-heading">
      <div className={`py-12 sm:py-16 ${EDGE}`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p id="tracker-heading" className="text-sm font-medium text-[var(--text-tertiary)]">Live Tracker</p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-snug text-[var(--text-primary)]">
              Partnerships Tracker
              {items.length > 0 && (
                <span className="text-base font-normal text-[var(--text-tertiary)] ml-2">· {items.length}</span>
              )}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              Live collaboration — edits autosave. All changes sync instantly across devices.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-[var(--accent-on)] shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
            style={{ background: "var(--accent)" }}
            disabled={isPending}
          >
            <Plus size={18} /> Add Entry
          </button>
        </div>

        {/* Add Form Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <div className="w-full max-w-2xl rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="border-b border-[var(--glass-border)] p-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Add Entry</h3>
                <button onClick={() => setShowAdd(false)} className="text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Name *</label>
                    <input name="name" required value={addDraft.name || ""} onChange={handleAddChange} placeholder="Organization or contact name"
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Position</label>
                    <input name="position" value={addDraft.position || ""} onChange={handleAddChange} placeholder="Job title / Role"
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Contact</label>
                    <input name="contact" value={addDraft.contact || ""} onChange={handleAddChange} placeholder="Phone, email, LinkedIn..."
                      className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Notes</label>
                  <textarea name="notes" value={addDraft.notes || ""} onChange={handleAddChange} rows={3} placeholder="Internal notes..."
                    className="w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">To Be Done</label>
                    <textarea name="to_be_done" value={addDraft.to_be_done || ""} onChange={handleAddChange} rows={3} placeholder="Action items, follow-ups..."
                      className="w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Updates</label>
                    <textarea name="updates" value={addDraft.updates || ""} onChange={handleAddChange} rows={3} placeholder="Progress updates..."
                      className="w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                  </div>
                </div>
                <button disabled={isPending} type="submit" className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 text-base">
                  {isPending ? "Saving..." : "Add Entry"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Cards */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] p-16 text-center">
            <FileText size={56} className="mx-auto mb-5 opacity-20 text-[var(--text-tertiary)]" />
            <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">No tracker entries yet</h3>
            <p className="text-base text-[var(--text-tertiary)] mb-8">Add your first partnership tracker entry to get started.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-[var(--accent-on)] text-base"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={18} /> Add First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-5 mt-8">
            {items.map((item) => {
              const isEditing = editingId === item.id;
              const isSaving = savingIds.has(item.id);
              const d = isEditing ? { ...item, ...editDraft } : item;

              return (
                <div
                  key={item.id}
                  className="relative rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] overflow-hidden transition-shadow hover:shadow-md"
                >
                  {/* Accent strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)] opacity-60" />

                  <div className="pl-5 pr-5 py-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight break-words">
                          {d.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                          {d.position && (
                            <span className="inline-flex items-center gap-1.5 text-base text-[var(--text-secondary)]">
                              <Briefcase size={15} className="shrink-0 opacity-60" />
                              {d.position}
                            </span>
                          )}
                          {d.contact && (
                            <span className="inline-flex items-center gap-1.5 text-base text-[var(--text-secondary)]">
                              <ExternalLink size={15} className="shrink-0 opacity-60" />
                              {d.contact}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(item.id)} disabled={isSaving} title="Save"
                              className="rounded-xl p-3 text-green-500 hover:bg-green-500/10 disabled:opacity-50 transition-colors">
                              {isSaving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                            </button>
                            <button onClick={cancelEdit} title="Cancel"
                              className="rounded-xl p-3 text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors">
                              <X size={22} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} title="Edit"
                              className="rounded-xl p-3 text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors">
                              <Edit2 size={22} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} title="Delete"
                              className="rounded-xl p-3 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors">
                              <Trash2 size={22} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline edit fields (when editing) */}
                    {isEditing && (
                      <div className="mb-4 grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-subtle)]">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Position</label>
                          <input name="position" value={d.position || ""} onChange={handleEditChange}
                            className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] px-4 py-2.5 text-base outline-none focus:border-[var(--accent)]" />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Contact</label>
                          <input name="contact" value={d.contact || ""} onChange={handleEditChange}
                            className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] px-4 py-2.5 text-base outline-none focus:border-[var(--accent)]" />
                        </div>
                      </div>
                    )}

                    {/* Content sections */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Notes */}
                      <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)] mb-2">
                          <MessageSquare size={16} /> Notes
                        </label>
                        {isEditing ? (
                          <textarea name="notes" value={d.notes || ""} onChange={handleEditChange} rows={3}
                            placeholder="Internal notes..."
                            className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-base)] px-3 py-2 text-base outline-none focus:border-[var(--accent)]" />
                        ) : (
                          <textarea
                            value={item.notes || ""}
                            onChange={e => saveNotes(item.id, e.target.value)}
                            placeholder="Type notes... autosaves"
                            className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-base)] px-3 py-2 text-base outline-none focus:border-[var(--accent)] transition-colors hover:border-[var(--text-tertiary)]"
                            rows={3}
                          />
                        )}
                      </div>

                      {/* To Be Done */}
                      <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)] mb-2">
                          <CheckCircle2 size={16} /> To Be Done
                        </label>
                        {isEditing ? (
                          <textarea name="to_be_done" value={d.to_be_done || ""} onChange={handleEditChange} rows={3}
                            placeholder="Action items..."
                            className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-base)] px-3 py-2 text-base outline-none focus:border-[var(--accent)]" />
                        ) : (
                          <div className="min-h-[5rem] text-base text-[var(--text-primary)] whitespace-pre-wrap break-words">
                            {item.to_be_done || <span className="text-[var(--text-tertiary)] italic">—</span>}
                          </div>
                        )}
                      </div>

                      {/* Updates */}
                      <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)] mb-2">
                          <MessageSquare size={16} /> Updates
                        </label>
                        <textarea
                          value={item.updates || ""}
                          onChange={e => saveUpdates(item.id, e.target.value)}
                          placeholder="Type updates... autosaves"
                          className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-base)] px-3 py-2 text-base outline-none focus:border-[var(--accent)] transition-colors hover:border-[var(--text-tertiary)]"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
