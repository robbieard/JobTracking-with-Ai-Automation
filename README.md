# JobTracking

Career-search frontend built with Next.js 16. The root route is the landing page, `/auth?intent=signup` creates accounts with email verification, `/auth?intent=login` signs in with email and password, and `/dashboard` is protected by a verified Supabase session.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. In Supabase Auth, enable email confirmation and set the **Confirm signup** template to include `{{ .Token }}` so new users receive an OTP.
3. Set the Supabase email OTP expiry to 120 seconds. The signup interface offers resend after two minutes; Supabase also enforces its own resend rate limit.
4. Create an hCaptcha site and secret. Enable hCaptcha in Supabase Auth CAPTCHA protection and use the same secret in `HCAPTCHA_SECRET_KEY` for the password setup endpoint.
5. Add `http://localhost:3000/**` to the Supabase Auth redirect URL allowlist for local use.
6. Run `npm run dev` and open `http://localhost:3000`.

`SUPABASE_SECRET_KEY` is a server-only admin credential. Never prefix it with `NEXT_PUBLIC_` or expose it to browser code. It is used only to set the server-controlled `app_metadata.password_setup_complete` claim after email verification and CAPTCHA validation.

Login submits email and password directly, without an email OTP step. Account creation sends a signup OTP; Supabase does not send a new signup confirmation to an address that already has an account. After a new address is verified, the user sets a password. `SUPABASE_SECRET_KEY` is a server-only admin credential used to set the server-controlled `app_metadata.password_setup_complete` claim after email verification and CAPTCHA validation. The Next.js 16 `src/proxy.ts` refreshes and verifies Supabase claims and blocks dashboard access until password setup is complete.

## Database

The backend foundation lives in `supabase/migrations/20261110000000_backend_foundation.sql`. It creates:

- `profiles` — one row per auth user, kept in sync with `user_metadata.full_name`.
- `jobs` — normalized postings from external sources, unique by `(source, external_id)`.
- `job_matches` — per-user AI match score and reason.
- `saved_jobs` — user bookmarks.
- `applications` — application pipeline entries with statuses.
- `ai_monitoring_events` — telemetry for AI calls, ingestion, and email alerts.

Row level security is enabled on every table. Users can read jobs, manage their own saved jobs and applications, and read their own matches and monitoring events. Writes to `jobs`, `job_matches`, and `ai_monitoring_events` are reserved for the server-side admin client.

Apply the migration after linking the project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Alternatively, paste the migration into the Supabase SQL editor. Regenerate types after schema changes:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

`SUPABASE_SECRET_KEY` is only used by `src/lib/supabase/admin.ts` for trusted server-side work. Never import that module from client code.

## AI gateway

Provider keys live only in `.env.local` and must never use the `NEXT_PUBLIC_` prefix:

```env
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

`src/lib/ai/` contains the provider adapters, fallback routing, cost calculation, and telemetry writer. Every AI call is recorded in `ai_monitoring_events` through the server-only admin client.

- `POST /api/ai/health` sends a tiny ping to each configured provider and records the result. The AI Monitoring page reads that telemetry for its cards, charts, and activity log.
- Apply `supabase/migrations/20261111000000_ai_gateway.sql` to add the `ai_ping` telemetry kind before using the connection test.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
