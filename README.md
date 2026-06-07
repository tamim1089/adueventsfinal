# Al Ain Campus Events App

Part of the **ADU Apps** platform. Helps organize and present Al Ain Campus
events and activities in a structured, accessible way.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind) — see `AGENTS.md`, this is a
  newer Next.js with breaking changes; read `node_modules/next/dist/docs/` before coding.
- **Supabase** — Postgres database, Storage (posters/photos/attendance/certs), and Auth.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase credentials
npm run dev                         # http://localhost:3000
```

## Organizers (filter / navigation)

Events are organized and browsable by:

- College of Engineering
- College of Business
- College of Law
- College of Health Sciences
- College of Arts, Education, and Social Sciences
- Student Affairs Department
- Admission and Registration
- Innovation Center
- Academic Success Center
- Library
- Campus Director Office

## Requested features

- [ ] Sort / navigate events by organizer
- [ ] Upload event posters with date, time, location
- [ ] Upload attendance lists
- [ ] Auto-generate and share certificates for specific events
- [ ] Optional post-event survey for participant feedback
- [ ] Upload post-event photos
- [ ] Download event reports
- [ ] Show currently running / overlapping events
- [ ] Annual report section per department / college

> Status: environment scaffolded. No features built yet.
