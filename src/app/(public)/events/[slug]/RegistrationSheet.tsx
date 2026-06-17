"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BadgeCheck, GraduationCap, Building2, X, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { registerForEvent } from "./register-actions";
import type { School } from "@/lib/schools-data";

type Kind = "uni" | "school";
const labelCls = "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";
const fieldCls =
  "w-full rounded-[10px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]";

export default function RegistrationSheet({
  event,
  schools,
}: {
  event: { id: string; title: string; audience: "uni" | "external" };
  schools: School[];
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState<Kind>(event.audience === "external" ? "school" : "uni");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [uniId, setUniId] = useState("");
  const [position, setPosition] = useState("Student");
  const [grade, setGrade] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schoolQ, setSchoolQ] = useState("");
  const [schoolOpen, setSchoolOpen] = useState(false);

  const matches = useMemo(() => {
    const q = schoolQ.trim().toLowerCase();
    if (!q) return schools.slice(0, 8);
    return schools.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [schoolQ, schools]);

  function reset() {
    setDone(false);
    setPending(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const res = await registerForEvent({
      eventId: event.id,
      kind,
      fullName,
      email,
      uniId,
      position,
      schoolId,
      grade,
    });
    if (res.ok) {
      setDone(true);
      setPending(false);
      toast.success("You're registered");
    } else {
      setPending(false);
      toast.error(res.error);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { reset(); setOpen(true); }}
        className="mt-6 w-full rounded-full py-4 text-base font-semibold text-[var(--accent-on)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        style={{ background: "var(--accent)" }}
      >
        Register to attend
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-base)] sm:inset-y-0 sm:my-auto sm:h-fit"
              style={{ borderRadius: "var(--r-xl)", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
              initial={reduce ? { opacity: 0 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              drag={reduce ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => { if (info.offset.y > 130) setOpen(false); }}
            >
              {/* drag handle (mobile) */}
              <div className="flex shrink-0 justify-center pt-3 sm:hidden">
                <span className="h-1.5 w-10 rounded-full bg-[var(--glass-border)]" />
              </div>

              <div className="flex items-start justify-between gap-4 px-6 pt-4 sm:pt-6">
                <div>
                  <p className="text-sm font-medium text-[var(--accent)]">Register</p>
                  <h2 dir="auto" className="mt-1 font-display text-2xl font-bold leading-tight text-[var(--text-primary)]">
                    {event.title}
                  </h2>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]">
                  <X size={18} />
                </button>
              </div>

              {done ? (
                <div className="px-6 pb-8 pt-6 text-center">
                  <BadgeCheck className="mx-auto text-[var(--accent)]" size={40} />
                  <p className="mt-4 font-display text-xl font-semibold text-[var(--text-primary)]">You&apos;re registered.</p>
                  <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    We&apos;ve saved your spot. Your certificate of attendance will be emailed to{" "}
                    <span className="font-medium text-[var(--text-primary)]">{email}</span> after the event.
                  </p>
                  <button onClick={() => setOpen(false)} className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-on)]" style={{ background: "var(--accent)" }}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
                  {/* who are you */}
                  <p className={labelCls}>I&apos;m registering as</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([["uni", "ADU student / staff", Building2], ["school", "School student", GraduationCap]] as const).map(([k, lbl, Icon]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        className={`flex items-center gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors ${
                          kind === k ? "border-[var(--accent)] text-[var(--text-primary)]" : "border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Icon size={18} className={kind === k ? "text-[var(--accent)]" : ""} /> {lbl}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className={labelCls}>Full name</label>
                      <Input className={fieldCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As it should appear on your certificate" required />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <Input className={fieldCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={kind === "uni" ? "name@adu.ac.ae" : "your email"} required />
                    </div>

                    {kind === "uni" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls}>ADU ID</label>
                          <Input className={fieldCls} value={uniId} onChange={(e) => setUniId(e.target.value)} placeholder="e.g. 1090123" />
                        </div>
                        <div>
                          <label className={labelCls}>Role</label>
                          <div className="relative">
                            <select className={`${fieldCls} appearance-none pr-10`} value={position} onChange={(e) => setPosition(e.target.value)}>
                              <option>Student</option>
                              <option>Faculty</option>
                              <option>Staff</option>
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                          <label className={labelCls}>Your school</label>
                          <div className="relative">
                            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                              className={`${fieldCls} pl-10`}
                              value={schoolQ}
                              onChange={(e) => { setSchoolQ(e.target.value); setSchoolId(""); setSchoolOpen(true); }}
                              onFocus={() => setSchoolOpen(true)}
                              placeholder="Search your school…"
                              autoComplete="off"
                            />
                          </div>
                          {schoolOpen && matches.length > 0 && !schoolId && (
                            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] shadow-lg">
                              {matches.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => { setSchoolId(s.id); setSchoolQ(s.name); setSchoolOpen(false); }}
                                  className="block w-full px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                                >
                                  {s.name}
                                  {s.category ? <span className="ml-2 text-xs text-[var(--text-tertiary)]">{s.category}</span> : null}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>Grade</label>
                          <Input className={fieldCls} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 11" />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-6 w-full rounded-full py-4 text-base font-semibold text-[var(--accent-on)] transition-transform active:scale-[0.98] disabled:opacity-60"
                    style={{ background: "var(--accent)" }}
                  >
                    {pending ? "Registering…" : "Confirm registration"}
                  </button>
                  <p className="mt-3 text-center text-xs text-[var(--text-tertiary)]">
                    Registering counts as attendance. Your certificate is emailed after the event.
                  </p>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
