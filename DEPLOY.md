# Deploy — Supabase + Netlify

Three phases: **Supabase** (database) → **local env** → **Netlify** (hosting).

---

## 1. Supabase (do this first — you need the keys)

1. Create a project at https://supabase.com → **New project** (pick a region near the UAE,
   e.g. `eu-central` or `me-central` if offered). Save the database password somewhere safe.
2. Run the schema. In the Supabase dashboard → **SQL Editor** → **New query**, paste the entire
   contents of:

   ```
   supabase/migrations/0001_init.sql
   ```

   …and click **Run**. This creates all tables, the default-deny RLS policies, the storage
   buckets, and seeds the 11 organizers. (You should see "Success. No rows returned".)
3. Get the keys. Dashboard → **Project Settings** → **API**. Copy these three values:

   | Copy this from Supabase                | Paste into this env var            | Exposed to browser? |
   | -------------------------------------- | ---------------------------------- | ------------------- |
   | **Project URL**                        | `NEXT_PUBLIC_SUPABASE_URL`         | yes (safe)          |
   | **Project API keys → `anon` `public`** | `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | yes (safe)          |
   | **Project API keys → `service_role`**  | `SUPABASE_SERVICE_ROLE_KEY`        | **NO — server only**|

   > The `service_role` key bypasses RLS. Never put it in client code or commit it. It only
   > lives in env vars and is used in server code (cert generation, exports).
4. Auth redirect URLs (so login works on the deployed site): Dashboard → **Authentication** →
   **URL Configuration** → set **Site URL** to your Netlify URL (e.g. `https://your-site.netlify.app`)
   and add it under **Redirect URLs** too. Also add `http://localhost:3100` for local dev.

---

## 2. Local env (to test before pushing)

Open `.env.local` (already in the repo root, git-ignored) and fill in the three values from step 1.3:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # the anon public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...        # the service_role key
```

Then:

```bash
npm run build && PORT=3100 npm run start    # verify locally at http://localhost:3100
```

---

## 3. Netlify

The repo already has `netlify.toml` (build command, publish dir, Next.js runtime, Node 22).

1. Push the repo to GitHub (see "Before you push" below).
2. On https://app.netlify.com → **Add new site** → **Import an existing project** → pick the repo.
   Netlify auto-detects Next.js; leave the build command/publish as-is (the toml sets them).
3. **Set the env vars** before the first build: Site → **Settings** → **Environment variables** →
   add the SAME three keys from step 1.3:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

   > `NEXT_PUBLIC_*` vars are baked in at **build time** — they must exist before the build runs.
   > If you add them after a deploy, trigger a redeploy.
4. **Deploy**. Netlify builds and gives you a `*.netlify.app` URL.
5. Go back to Supabase step 1.4 and put that URL in the Auth URL Configuration.

---

## Before you push (one-time)

```bash
# create a GitHub repo, then:
git remote add origin https://github.com/<you>/al-ain-events.git
git push -u origin master
```

`.env.local` is git-ignored, so your keys never leave your machine. Set them in the Netlify
dashboard instead (step 3.3).

## TL;DR — what to copy where
- **Run in Supabase:** `supabase/migrations/0001_init.sql` (SQL Editor).
- **Copy from Supabase** (Settings → API): Project URL + `anon` key + `service_role` key.
- **Paste into:** `.env.local` (local) and Netlify **Environment variables** (prod).

## Certificates

Registering for an event issues a **certificate of attendance** (PDF) carrying
the recipient's name + a per-event description, stamped onto the ADU template.

**Working path (live now, no DB):** the public event page → "Register to
attend" form → `POST /api/certificate` (Node runtime) renders the PDF with
`pdf-lib` (base at `public/cert-templates/udl-base.pdf`, fonts under
`src/lib/certificates/fonts/`) and streams it back for instant download.
`next.config.ts` traces those assets into the function via
`outputFileTracingIncludes`.

**To recalibrate the template:** edit coordinates in
`src/lib/certificates/templates.ts`, run `node scripts/test-cert.mjs`, and open
`/tmp/cert-sample.pdf`.

**Persistence layer (scaffolded, not yet wired):** to record attendees + store
issued PDFs idempotently with an unguessable serial and signed-URL downloads:
1. Migrate the public events from `src/lib/events-data.ts` into the Supabase
   `events` table (the public pages currently read the static array; the DB has
   no events yet). Each needs a `slug` and `status='published'`.
2. Apply `supabase/migrations/0002_certificates.sql` (`supabase db push`) — adds
   `slug` + `certificate_*` columns to `events`, the per-event/email unique
   index on `attendees`, and the `certificates` storage policy.
3. `SUPABASE_SERVICE_ROLE_KEY` is already in `.env.local`/Netlify; it is used
   **only** by `src/lib/supabase/admin.ts` (server-only). Never import it client-side.
4. Swap the `/api/certificate` route for a Server Action that: validates the
   event is published, upserts the attendee (dedup via the unique index),
   uploads the PDF to the private `certificates` bucket at
   `${event.id}/${attendee.id}.pdf`, inserts a `certificates` row, and returns a
   short-TTL signed URL. Re-registration reuses the same serial (idempotent).
