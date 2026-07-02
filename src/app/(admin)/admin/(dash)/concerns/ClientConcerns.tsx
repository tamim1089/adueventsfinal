"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateConcernNotes, addConcern } from "./actions";
import { Plus, Search, User, Phone, Mail, Clock, CheckCircle2, MessageSquareWarning } from "lucide-react";

export type Concern = {
  id: string;
  name: string;
  student_id: string;
  phone_number: string;
  email: string | null;
  concern: string;
  updates: string;
  created_at: string;
};

export default function ClientConcerns({ initialConcerns }: { initialConcerns: Concern[] }) {
  const [concerns, setConcerns] = useState<Concern[]>(initialConcerns);
  const [selectedId, setSelectedId] = useState<string | null>(initialConcerns[0]?.id || null);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync state if server data changes (e.g. after add)
  useEffect(() => {
    setConcerns(initialConcerns);
  }, [initialConcerns]);

  // For auto-save
  const [notes, setNotes] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const selectedConcern = concerns.find(c => c.id === selectedId);

  useEffect(() => {
    if (selectedConcern) {
      setNotes(selectedConcern.updates || "");
      setSaveStatus("idle");
    }
  }, [selectedId, selectedConcern?.updates]);

  useEffect(() => {
    if (!selectedConcern || notes === selectedConcern.updates) return;

    setSaveStatus("saving");
    const handler = setTimeout(() => {
      startTransition(async () => {
        const res = await updateConcernNotes(selectedConcern.id, notes);
        if (res.success) {
          setSaveStatus("saved");
          setConcerns(prev => prev.map(c => c.id === selectedConcern.id ? { ...c, updates: notes } : c));
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("idle");
          alert(res.error);
        }
      });
    }, 1000); // 1s debounce

    return () => clearTimeout(handler);
  }, [notes, selectedConcern]);

  const filtered = concerns.filter(c => 
    `${c.name} ${c.student_id} ${c.concern}`.toLowerCase().includes(q.toLowerCase())
  );

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addConcern(formData);
      if (res.error) {
        alert(res.error);
      } else {
        setShowAdd(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* LEFT COLUMN: LIST */}
      <div className="flex w-1/3 flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] shadow-sm">
        <div className="border-b border-[var(--glass-border)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Student Concerns</h2>
            <button 
              onClick={() => setShowAdd(true)}
              className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-white hover:opacity-90"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-3 py-2">
            <Search size={14} className="text-[var(--text-tertiary)]" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search ID, name..."
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
              No concerns found.
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`mb-2 w-full rounded-xl p-3 text-left transition-colors ${
                  selectedId === c.id
                    ? "bg-[var(--accent)] bg-opacity-10 shadow-[inset_0_0_0_1px_var(--accent)]"
                    : "hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className={`font-semibold text-sm ${selectedId === c.id ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                    {c.name}
                  </p>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">ID: {c.student_id}</p>
                <p className="mt-1 line-clamp-1 text-xs text-[var(--text-tertiary)]">{c.concern}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILS & LIVE NOTES */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] shadow-sm">
        {showAdd ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Log New Concern</h2>
              <button onClick={() => setShowAdd(false)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Student Name *</label>
                  <input name="name" required className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Student ID *</label>
                  <input name="student_id" required className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Phone Number *</label>
                  <input name="phone_number" required className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Email (Optional)</label>
                  <input name="email" type="email" className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">The Concern / Issue *</label>
                <textarea name="concern" required rows={4} className="w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"></textarea>
              </div>

              <button disabled={isPending} type="submit" className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {isPending ? "Saving..." : "Log Concern"}
              </button>
            </form>
          </div>
        ) : selectedConcern ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--glass-border)] bg-[var(--bg-subtle)] p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white shadow-sm dark:bg-black/20">
                  <User size={24} className="text-[var(--text-tertiary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedConcern.name}</h2>
                  <p className="font-mono text-sm text-[var(--accent)]">{selectedConcern.student_id}</p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 dark:bg-white/5">
                  <Phone size={14} /> {selectedConcern.phone_number}
                </div>
                {selectedConcern.email && (
                  <div className="flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 dark:bg-white/5">
                    <Mail size={14} /> {selectedConcern.email}
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 dark:bg-white/5">
                  <Clock size={14} /> {new Date(selectedConcern.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-8">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Initial Concern</h3>
                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-4 text-sm leading-relaxed text-[var(--text-primary)]">
                  {selectedConcern.concern}
                </div>
              </div>

              <div className="flex flex-1 flex-col h-full min-h-[300px]">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Live Notes / Updates</h3>
                  <div className="text-xs font-medium">
                    {saveStatus === "saving" && <span className="text-[var(--text-tertiary)] animate-pulse">Saving...</span>}
                    {saveStatus === "saved" && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={14} /> Saved</span>}
                  </div>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type notes here... they will autosave as you type."
                  className="flex-1 w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-4 text-sm leading-relaxed text-[var(--text-primary)] shadow-inner outline-none focus:border-[var(--accent)] focus:bg-[var(--bg-base)] transition-colors"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-[var(--text-tertiary)]">
            <MessageSquareWarning size={48} className="mb-4 opacity-20" />
            <p>Select a concern from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}
