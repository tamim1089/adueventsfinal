"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Save, X, Edit2, Trash2, Loader2, Check, FileText, Briefcase, Phone, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { updatePartnershipTracker, updatePartnershipTrackerNotes, updatePartnershipTrackerUpdates, deletePartnershipTracker, addPartnershipTracker, type PartnershipTrackerItem } from "./actions";

const COLUMNS = [
  { key: "name", label: "Name", width: "w-48" },
  { key: "position", label: "Position", width: "w-36" },
  { key: "contact", label: "Contact", width: "w-48" },
  { key: "notes", label: "Notes", width: "w-64" },
  { key: "to_be_done", label: "To Be Done", width: "w-48" },
  { key: "updates", label: "Updates", width: "w-64" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

function getCellContent(item: PartnershipTrackerItem, key: ColumnKey) {
  const value = item[key];
  if (!value) return <span className="text-[var(--text-tertiary)] italic">—</span>;
  return <span className="text-[var(--text-primary)]">{value}</span>;
}

export default function PartnershipsTracker({ initialItems = [] }: { initialItems?: PartnershipTrackerItem[] }) {
  const [items, setItems] = useState<PartnershipTrackerItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PartnershipTrackerItem>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState<Partial<PartnershipTrackerItem>>({});
  const [isPending, startTransition] = useTransition();
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // Realtime subscription
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
          if (payload.new) setItems((prev) => [mapRow(payload.new), ...prev]);
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

  // Sync with server data
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

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
    if (!confirm("Delete this entry?")) return;
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
      else { setShowAdd(false); setAddDraft({}); }
    });
  }, []);

  const handleAddChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddDraft(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditDraft(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const renderedItems = items.map((item) => {
    const isEditing = editingId === item.id;
    const isSaving = savingIds.has(item.id);
    const d = isEditing ? { ...item, ...editDraft } : item;
    return (
      <div key={item.id} className={`px-4 py-3 transition-colors ${isEditing ? "bg-[var(--accent)] bg-opacity-5 ring-1 ring-[var(--accent)]" : "hover:bg-[var(--bg-subtle)]"}`}>
        {/* Desktop Table Row */}
        <div className="hidden sm:grid gap-4 items-start"
          style={{ gridTemplateColumns: "minmax(120px, 1fr) minmax(90px, 1fr) minmax(120px, 1fr) minmax(160px, 1fr) minmax(120px, 1fr) minmax(160px, 1fr) 56px" }}>
          <div className="font-medium text-[var(--text-primary)] truncate">{d.name}</div>
          <div className="text-sm text-[var(--text-secondary)] truncate">{getCellContent(d, "position")}</div>
          <div className="text-sm text-[var(--text-secondary)] truncate">{getCellContent(d, "contact")}</div>
          <div className="text-sm text-[var(--text-tertiary)] line-clamp-2">{getCellContent(d, "notes")}</div>
          <div className="text-sm text-[var(--text-tertiary)] line-clamp-2">{getCellContent(d, "to_be_done")}</div>
          <div className="text-sm text-[var(--text-tertiary)] line-clamp-2">{getCellContent(d, "updates")}</div>
          <div className="flex items-center justify-center gap-1">
            {isEditing ? (
              <>
                <button onClick={() => saveEdit(item.id)} disabled={isSaving} title="Save" className="rounded-md p-1.5 text-green-500 hover:bg-green-500/10 disabled:opacity-50 transition-colors">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                </button>
                <button onClick={cancelEdit} title="Cancel" className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] transition-colors"><X size={14} /></button>
              </>
            ) : (
              <>
                <button onClick={() => startEdit(item)} title="Edit" className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(item.id)} title="Delete" className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3 pb-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[var(--text-primary)] truncate">{d.name}</h4>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button onClick={() => saveEdit(item.id)} disabled={isSaving} className="rounded-md p-1.5 text-green-500 hover:bg-green-500/10 disabled:opacity-50"><Save size={14} /></button>
                  <button onClick={cancelEdit} className="rounded-md p-1.5 text-[var(--text-tertiary)]"><X size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(item)} className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)]"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:text-red-500"><Trash2 size={14} /></button>
                </>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><span className="text-xs font-medium text-[var(--text-tertiary)]">Position</span> <div className="text-sm">{getCellContent(d, "position")}</div></div>
            <div className="sm:col-span-2"><span className="text-xs font-medium text-[var(--text-tertiary)]">Contact</span> <div className="text-sm">{getCellContent(d, "contact")}</div></div>
            <div className="sm:col-span-2"><span className="text-xs font-medium text-[var(--text-tertiary)]">Notes</span> <div className="text-sm line-clamp-3">{getCellContent(d, "notes")}</div></div>
            <div className="sm:col-span-2"><span className="text-xs font-medium text-[var(--text-tertiary)]">To Be Done</span> <div className="text-sm line-clamp-3">{getCellContent(d, "to_be_done")}</div></div>
            <div className="sm:col-span-2"><span className="text-xs font-medium text-[var(--text-tertiary)]">Updates</span> <div className="text-sm line-clamp-3">{getCellContent(d, "updates")}</div></div>
          </div>
          {isEditing && (
            <div className="border-t border-[var(--glass-border)] pt-3 space-y-3">
              <button onClick={() => saveEdit(item.id)} disabled={isSaving} className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          )}
        </div>

        {/* Inline Editable Fields (Notes/Updates) - always visible for quick editing */}
        {!isEditing && (
          <div className="pt-3 border-t border-[var(--glass-border)] grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--accent)] mb-1">
                <MessageSquare size={12} /> Notes (autosaves)
              </label>
              <textarea
                value={item.notes || ""}
                onChange={e => saveNotes(item.id, e.target.value)}
                placeholder="Type notes... autosaves on blur"
                className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--accent)] mb-1">
                <CheckCircle2 size={12} /> Updates (autosaves)
              </label>
              <textarea
                value={item.updates || ""}
                onChange={e => saveUpdates(item.id, e.target.value)}
                placeholder="Type updates... autosaves on blur"
                className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)] mb-1">
                <Briefcase size={12} /> Position
              </label>
              <input
                value={item.position || ""}
                onChange={e => {
                  const v = e.target.value;
                  const fd = new FormData(); fd.append("position", v);
                  startTransition(async () => {
                    await updatePartnershipTracker(item.id, fd);
                  });
                }}
                placeholder="Position / Role"
                className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)] mb-1">
                <Phone size={12} /> Contact
              </label>
              <input
                value={item.contact || ""}
                onChange={e => {
                  const v = e.target.value;
                  const fd = new FormData(); fd.append("contact", v);
                  startTransition(async () => {
                    await updatePartnershipTracker(item.id, fd);
                  });
                }}
                placeholder="Phone, Email, LinkedIn..."
                className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)] mb-1">
                <FileText size={12} /> To Be Done
              </label>
              <textarea
                value={item.to_be_done || ""}
                onChange={e => {
                  const v = e.target.value;
                  const fd = new FormData(); fd.append("to_be_done", v);
                  startTransition(async () => {
                    await updatePartnershipTracker(item.id, fd);
                  });
                }}
                placeholder="Action items, follow-ups..."
                className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    );
  });

  const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

  return (
    <section className="border-t border-[var(--glass-border)] bg-[var(--bg-base)]" aria-labelledby="tracker-heading">
      <div className={`py-12 sm:py-16 ${EDGE}`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p id="tracker-heading" className="text-sm font-medium text-[var(--accent)]">Live Tracker</p>
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
              <div className="border-b border-[var(--glass-border)] p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Tracker Entry</h3>
                <button onClick={() => setShowAdd(false)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Name *</label>
                    <input name="name" required value={addDraft.name || ""} onChange={handleAddChange} placeholder="Contact / Company name"
                      className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Position</label>
                    <input name="position" value={addDraft.position || ""} onChange={handleAddChange} placeholder="Job title / Role"
                      className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Contact</label>
                    <input name="contact" value={addDraft.contact || ""} onChange={handleAddChange} placeholder="Phone, email, LinkedIn..."
                      className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Notes</label>
                    <textarea name="notes" value={addDraft.notes || ""} onChange={handleAddChange} rows={3} placeholder="Internal notes..."
                      className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">To Be Done</label>
                    <textarea name="to_be_done" value={addDraft.to_be_done || ""} onChange={handleAddChange} rows={3} placeholder="Action items, follow-ups..."
                      className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Updates</label>
                    <textarea name="updates" value={addDraft.updates || ""} onChange={handleAddChange} rows={3} placeholder="Progress updates..."
                      className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
                  </div>
                </div>
                <button disabled={isPending} type="submit" className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {isPending ? "Saving..." : "Add Entry"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tracker Table */}
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] overflow-hidden">
          {/* Header */}
          <div className="grid border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hidden sm:grid"
            style={{ gridTemplateColumns: "minmax(120px, 1fr) minmax(90px, 1fr) minmax(120px, 1fr) minmax(160px, 1fr) minmax(120px, 1fr) minmax(160px, 1fr) 56px" }}>
            {COLUMNS.map(c => <div key={c.key} className={c.width}>{c.label}</div>)}
            <div className="w-14 text-center">Actions</div>
          </div>

          {/* Mobile Card View / Desktop Table Rows */}
          <div className="divide-y divide-[var(--glass-border)]">
            {items.length === 0 && (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto mb-4 opacity-20 text-[var(--text-tertiary)]" />
                <h3 className="mb-2 font-semibold text-[var(--text-primary)]">No tracker entries yet</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-6">Add your first partnership tracker entry to get started.</p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-[var(--accent-on)]"
                  style={{ background: "var(--accent)" }}
                >
                  <Plus size={18} /> Add First Entry
                </button>
              </div>
            )}
            {renderedItems}
          </div>
        </div>
      </div>
    </section>
  );
}
