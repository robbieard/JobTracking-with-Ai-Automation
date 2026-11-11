"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export async function updateProfileName(name: string): Promise<UpdateProfileResult> {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { ok: false, error: "Nama minimal 2 karakter." };
  }

  if (trimmed.length > 60) {
    return { ok: false, error: "Nama maksimal 60 karakter." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Sesi kamu sudah berakhir. Silakan masuk lagi." };
  }

  const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });

  if (error) {
    return { ok: false, error: "Nama gagal diperbarui. Coba lagi." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/find-job");

  return { ok: true, name: trimmed };
}
