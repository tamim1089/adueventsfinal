import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, Globe, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "EmpowerED Series",
  description: "ADU Al Ain Campus — EmpowerED Series: Knowledge, Skills, and Impact. A free public workshop series for educators, students, and the community.",
};

const EDGE = "px-[clamp(1.25rem,4vw,5rem)]";

const FEATURED = [
  {
    poster: "/empowered/beyond-words.jpeg",
    title: "Beyond Words: Unlocking Communication Through Body & Expression",
    presenter: "Dr. Nadim Khouri",
    role: "Assistant Professor of Broadcasting · College of Arts, Education & Social Sciences",
    date: "Thursday, 14 May 2026",
    time: "4:00 – 6:00 PM",
    venue: "Innovation Center",
    blurb:
      "Explore the power of nonverbal communication — convey messages, emotions, and ideas through body language, facial expressions, and gestures to elevate personal and professional interactions.",
  },
  {
    poster: "/empowered/english-game-zone.jpeg",
    title: "Step into the English Game Zone: where learning feels like play",
    presenter: "Ms. Kathryn Swift",
    role: "Senior Instructor of English · College of Arts, Education & Social Sciences",
    date: "Thursday, 21 May 2026",
    time: "4:00 – 6:00 PM",
    venue: "Auditorium",
    blurb:
      "Make English learning fun and interactive through games and activities — build language skills, confidence, and genuine enjoyment of the learning experience.",
  },
];

type Session = {
  date: string;
  month: string;
  title: string;
  ar?: boolean;
  presenter: string;
  role: string;
  time: string;
  venue: string;
  online: boolean;
  lang: "English" | "Arabic";
  featured?: boolean;
};

const SCHEDULE: Session[] = [
  { date: "5 Feb", month: "February", title: "Design Thinking", presenter: "Mr Abdelrahman Eladly", role: "Instructor of Entrepreneurship & Innovation · CBA", time: "4:00 – 6:00 PM", venue: "Auditorium", online: false, lang: "English" },
  { date: "12 Feb", month: "February", title: "Decoding Consumers: The Secret Ingredient of Winning Marketing Strategies", presenter: "Dr Mohammed El-Adly", role: "Professor of Marketing · CBA", time: "4:00 – 6:00 PM", venue: "Auditorium", online: false, lang: "English" },
  { date: "19 Feb", month: "February", title: "حماية المستهلك: لا تدفع أكثر مما تستحق!", ar: true, presenter: "د. محمد العريان", role: "أستاذ مساعد في القانون التجاري والبحري · كلية القانون", time: "2:00 – 4:00 PM", venue: "Online", online: true, lang: "Arabic" },
  { date: "26 Feb", month: "February", title: "حقوقي كطالب في القانون الإماراتي", ar: true, presenter: "د. الصغير مهدي", role: "أستاذ مشارك في القانون المدني · كلية القانون", time: "2:00 – 4:00 PM", venue: "Online", online: true, lang: "Arabic" },
  { date: "5 Mar", month: "March", title: "Inclusive Classroom Dynamics: Strategies for Effective Management & Academic Enrichment", presenter: "Dr Mohammad Ftieha", role: "Campus Director · Al Ain", time: "2:00 – 4:00 PM", venue: "Online", online: true, lang: "English" },
  { date: "12 Mar", month: "March", title: "Financial Literacy and A.I.", presenter: "Dr Ilias Kampouris", role: "Associate Professor of Finance · CBA", time: "2:00 – 4:00 PM", venue: "Online", online: true, lang: "English" },
  { date: "26 Mar", month: "March", title: "كيف تحمي نفسك من الجرائم الإلكترونية؟", ar: true, presenter: "د. حسين المحمد", role: "أستاذ مساعد في القانون الجنائي · كلية القانون", time: "4:00 – 6:00 PM", venue: "Online", online: true, lang: "Arabic" },
  { date: "2 Apr", month: "April", title: "كيف تحل نزاعًا دون الذهاب إلى المحكمة؟", ar: true, presenter: "د. ياسن شامي", role: "أستاذ مساعد في قانون الإجراءات المدنية · كلية القانون", time: "2:00 – 4:00 PM", venue: "Online", online: true, lang: "Arabic" },
  { date: "9 Apr", month: "April", title: "Effective Intercultural Communications", presenter: "Dr Mohamed Nasaj", role: "Assistant Professor of Management · CBA", time: "4:00 – 6:00 PM", venue: "Online", online: true, lang: "English" },
  { date: "16 Apr", month: "April", title: "Sustainability in Business — Adopting Sustainable Practices (UAE Vision 2030)", presenter: "Dr Muhammad Faisal", role: "Assistant Professor of HR Management · CBA", time: "4:00 – 6:00 PM", venue: "Online", online: true, lang: "English" },
  { date: "23 Apr", month: "April", title: "القانون في حياتنا اليومية", ar: true, presenter: "أ. خليفة الشامسي", role: "مساعد تدريس · كلية القانون", time: "4:00 – 6:00 PM", venue: "Auditorium", online: false, lang: "Arabic" },
  { date: "7 May", month: "May", title: "القانون بلغة بسيطة: ماذا يعني العقد؟", ar: true, presenter: "د. الصغير مهدي", role: "أستاذ مشارك في القانون المدني · كلية القانون", time: "4:00 – 6:00 PM", venue: "Innovation Center", online: false, lang: "Arabic" },
  { date: "14 May", month: "May", title: "Beyond Words: Unlocking Communication Through Body & Expression", presenter: "Dr. Nadim Khouri", role: "Assistant Professor of Broadcasting · Arts, Education & SS", time: "4:00 – 6:00 PM", venue: "Innovation Center", online: false, lang: "English", featured: true },
  { date: "21 May", month: "May", title: "Step into the English Game Zone — where learning feels like play", presenter: "Ms. Kathryn Swift", role: "Senior Instructor of English · Arts, Education & SS", time: "4:00 – 6:00 PM", venue: "Auditorium", online: false, lang: "English", featured: true },
  { date: "4 Jun", month: "June", title: "قانون العمل بلغة مبسطة: ما لك وما عليك!", ar: true, presenter: "د. ياسن شامي", role: "أستاذ مساعد في قانون الإجراءات المدنية · كلية القانون", time: "4:00 – 6:00 PM", venue: "Innovation Center", online: false, lang: "Arabic" },
];

const MONTHS = ["February", "March", "April", "May", "June"];

export default function EmpoweredEdSeriesPage() {
  return (
    <>
      {/* hero */}
      <section className={`border-b border-[var(--glass-border)] bg-[var(--bg-base)] pb-14 pt-28 sm:pb-16 ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--accent)]">ADU Al Ain Campus · Knowledge, Skills &amp; Impact</p>
        <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)]">
          EmpowerED Series.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
          A free workshop series inviting educators, students, and the wider community to learn, connect, and grow — across business, law, education, and communication. Every Thursday, on campus and online.
        </p>
      </section>

      {/* featured — the two posters */}
      <section className={`bg-[var(--bg-subtle)] py-16 sm:py-20 ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">In the spotlight</p>
        <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">Two sessions you don&apos;t want to miss.</h2>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {FEATURED.map((f) => (
            <article key={f.title} className="group grid grid-cols-1 overflow-hidden rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--bg-base)] sm:grid-cols-[minmax(0,0.85fr)_1fr]">
              {/* poster */}
              <div className="relative aspect-[10/14] overflow-hidden bg-black/5 sm:aspect-auto">
                <Image src={f.poster} alt={f.title} fill sizes="(min-width:1024px) 360px, 100vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              {/* info */}
              <div className="flex flex-col p-6 sm:p-7">
                <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.01em] text-[var(--text-primary)]">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{f.blurb}</p>

                <dl className="mt-5 space-y-2.5 border-t border-[var(--glass-border)] pt-5 text-sm">
                  <div className="flex items-center gap-2.5 text-[var(--text-secondary)]"><Calendar size={15} className="text-[var(--accent)]" /> {f.date}</div>
                  <div className="flex items-center gap-2.5 text-[var(--text-secondary)]"><Clock size={15} className="text-[var(--accent)]" /> {f.time}</div>
                  <div className="flex items-center gap-2.5 text-[var(--text-secondary)]"><MapPin size={15} className="text-[var(--accent)]" /> {f.venue}</div>
                </dl>

                <div className="mt-5">
                  <p className="font-semibold text-[var(--text-primary)]">{f.presenter}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{f.role}</p>
                </div>

                <Link href="/events" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-on)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]" style={{ background: "var(--accent)" }}>
                  Reserve your seat <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* full schedule */}
      <section className={`bg-[var(--bg-base)] py-16 sm:py-20 ${EDGE}`}>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Full programme · Spring 2026</p>
        <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">Every session, every Thursday.</h2>

        <div className="mt-10 space-y-12">
          {MONTHS.map((m) => {
            const items = SCHEDULE.filter((s) => s.month === m);
            if (!items.length) return null;
            return (
              <div key={m} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-2">
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] lg:sticky lg:top-28">{m}</h3>
                </div>
                <ul className="lg:col-span-10">
                  {items.map((s, i) => (
                    <li key={i} className={`grid grid-cols-[3.5rem_1fr] items-start gap-4 border-t border-[var(--glass-border)] py-5 last:border-b sm:grid-cols-[4rem_1fr_auto] ${s.featured ? "bg-[var(--accent-soft)]/40" : ""}`}>
                      <span className="font-mono text-sm tabular-nums text-[var(--text-tertiary)]">{s.date}</span>
                      <div>
                        <p dir={s.ar ? "rtl" : "ltr"} className="font-display text-lg font-semibold leading-snug text-[var(--text-primary)]">
                          {s.title}
                          {s.featured && <span className="ml-2 rounded-full bg-[var(--accent)] px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-white">Featured</span>}
                        </p>
                        <p dir={s.ar ? "rtl" : "ltr"} className="mt-1 text-sm text-[var(--text-secondary)]">{s.presenter} <span className="text-[var(--text-tertiary)]">· {s.role}</span></p>
                      </div>
                      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"><Clock size={11} /> {s.time}</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">{s.online ? <Globe size={11} /> : <MapPin size={11} />} {s.venue}</span>
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{s.lang}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className={`py-24 sm:py-28 ${EDGE}`} style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)" }}>
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.02em] text-white">Join the EmpowerED Series.</h2>
            <p className="mt-4 max-w-md text-white/85">Open to all — register for a session and earn a certificate of attendance from the Al Ain Campus.</p>
          </div>
          <Link href="/events" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[var(--accent-strong)] transition-transform active:scale-[0.98]">Browse sessions <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  );
}
