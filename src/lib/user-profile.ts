import type { User } from "@supabase/supabase-js";

export type DashboardUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
};

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Builds a readable display name from the email local-part.
 * `aditya.nugraha@example.com` -> `Aditya Nugraha`
 */
export function deriveNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.split("+")[0] ?? "";
  const cleaned = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const source = cleaned || localPart.replace(/[._-]+/g, " ").trim();

  if (!source) return "Pengguna JobTracking";

  return source.split(" ").filter(Boolean).map(capitalize).join(" ");
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "JT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function toDashboardUser(user: User): DashboardUser {
  const email = user.email ?? "";
  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const name = metadataName || deriveNameFromEmail(email);

  return {
    id: user.id,
    email,
    name,
    initials: getInitials(name),
  };
}
