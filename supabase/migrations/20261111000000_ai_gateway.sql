-- AI gateway: dedicated telemetry kind for provider connection checks.
-- Apply with `npx supabase db push` or paste this file into the Supabase SQL editor.

alter type public.ai_event_kind add value if not exists 'ai_ping';
