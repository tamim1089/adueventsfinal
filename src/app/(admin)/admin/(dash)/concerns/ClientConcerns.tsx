"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateConcernNotes, addConcern } from "./actions";
import { Plus, Search, User, Phone, Mail, Clock, CheckCircle2, MessageSquareWarning, X, Save } from "lucide-react";

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

  useEffect(() => {
    setConcerns(initialConcerns);
  }, [initialConcerns]);

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
    }, 1000);

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
      <div className="flex w-1/3 min-w-[280px] flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] shadow-sm">
        <div className="border-b border-[var(--glass-border)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Student Concerns</h2>
            <button 
              onClick={() => setShowAdd(true)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-2.5">
            <Search size={16} className="text-[var(--text-tertiary)]" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by ID, name..."
              className="w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-base text-[var(--text-tertiary)]">
              No concerns found.
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-xl p-4 text-left transition-all ${
                  selectedId === c.id
                    ? "bg-[var(--bg-subtle)] ring-1 ring-[var(--glass-border)] shadow-sm"
                    : "hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-base font-semibold ${selectedId === c.id ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>
                    {c.name}
                  </p>
                  <span className="shrink-0 text-sm text-[var(--text-tertiary)]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">ID: {c.student_id}</p>
                <p className="mt-1.5 line-clamp-2 text-sm text-[var(--text-tertiary)]">{c.concern}</p>
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
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Log New Concern</h2>
              <button onClick={() => setShowAdd(false)} 
                className="rounded-xl p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors">
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-5 max-w-xl">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Student Name *</label>
                  <input name="name" required className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Student ID *</label>
                  <input name="student_id" required className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Phone Number *</label>
                  <input name="phone_number" required className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">Email</label>
                  <input name="email" type="email" className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-base font-medium text-[var(--text-secondary)]">The Concern / Issue *</label>
                <textarea name="concern" required rows={5} className="w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" />
              </div>

              <button disabled={isPending} type="submit" className="w-full rounded-xl bg-[var(--accent)] px-5 py-3.5 font-semibold text-white hover:opacity-90 disabled:opacity-50 text-base">
                {isPending ? "Saving..." : "Log Concern"}
              </button>
            </form>
          </div>
        ) : selectedConcern ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--glass-border)] p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--bg-subtle)]">
                  <User size={28} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] truncate">{selectedConcern.name}</h2>
                  <p className="text-base text-[var(--text-secondary)]">ID: {selectedConcern.student_id}</p>
                </div>
              </div>
              
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                  <Phone size={16} /> {selectedConcern.phone_number}
                </div>
                {selectedConcern.email && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                    <Mail size={16} /> {selectedConcern.email}
                  </div>
                )}
                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                  <Clock size={16} /> {new Date(selectedConcern.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Initial Concern</h3>
                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-5 text-base leading-relaxed text-[var(--text-primary)]">
                  {selectedConcern.concern}
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-[250px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Live Notes / Updates</h3>
                  <div className="text-sm font-medium">
                    {saveStatus === "saving" && <span className="text-[var(--text-tertiary)] animate-pulse">Saving...</span>}
                    {saveStatus === "saved" && <span className="flex items-center gap-1.5 text-green-600"><CheckCircle2 size={16} /> Saved</span>}
                  </div>
                </div>
                <div className="flex flex-1 flex-col">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Type notes here... they will autosave as you type."
                    className="flex-1 w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-subtle)] p-5 text-base leading-relaxed text-[var(--text-primary)] shadow-inner outline-none focus:border-[var(--accent)] focus:bg-[var(--bg-base)] transition-colors min-h-[200px]"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-[var(--text-tertiary)] gap-4">
            <MessageSquareWarning size={56} className="opacity-20" />
            <p className="text-lg">Select a concern from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}
