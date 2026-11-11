"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Mail, X } from "lucide-react";
import { updateProfileName } from "@/app/actions/profile";
import { useAppPreferences } from "@/components/app-preferences";
import { useDashboard } from "@/components/dashboard/dashboard-context";

type ProfileDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  const { t } = useAppPreferences();
  const { user, setName } = useDashboard();
  const router = useRouter();
  const [draft, setDraft] = useState(user.name);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setDraft(user.name);
      setError("");
      setSuccess("");
    }
    wasOpen.current = open;
  }, [open, user.name]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = draft.trim();
  const canSave = trimmed.length >= 2 && trimmed !== user.name && !pending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await updateProfileName(draft);

      if (!result.ok) {
        setError(t(result.error));
        return;
      }

      setName(result.name);
      setDraft(result.name);
      setSuccess(t("Nama berhasil diperbarui."));
      router.refresh();
    });
  };

  return (
    <div
      className="profile-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
      >
        <header className="profile-dialog-header">
          <div>
            <p className="profile-dialog-eyebrow">{t("AKUN JOBTRACKING")}</p>
            <h2 id="profile-dialog-title">{t("Edit profil")}</h2>
            <p className="profile-dialog-subtitle">{t("Kelola informasi akunmu.")}</p>
          </div>
          <button className="profile-dialog-close" type="button" aria-label={t("Tutup")} onClick={onClose}>
            <X size={17} />
          </button>
        </header>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-avatar-row">
            <span className="avatar avatar-dialog">{user.initials}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <label className="profile-field" htmlFor="profile-name">
            <span>{t("Nama tampilan")}</span>
            <input
              id="profile-name"
              type="text"
              value={draft}
              maxLength={60}
              autoFocus
              autoComplete="name"
              onChange={(event) => {
                setDraft(event.target.value);
                setError("");
                setSuccess("");
              }}
            />
            <small>{t("Nama ini akan tampil di dashboard.")}</small>
          </label>

          <label className="profile-field" htmlFor="profile-email">
            <span>{t("Email")} <Lock size={11} /></span>
            <div className="profile-locked-input">
              <Mail size={14} />
              <input id="profile-email" type="email" value={user.email} readOnly aria-readonly="true" />
            </div>
            <small>{t("Email tidak dapat diubah.")}</small>
          </label>

          {error && <p className="profile-message profile-error" role="alert">{error}</p>}
          {success && (
            <p className="profile-message profile-success" role="status">
              <Check size={13} />
              {success}
            </p>
          )}

          <div className="profile-actions">
            <button className="profile-cancel" type="button" onClick={onClose} disabled={pending}>
              {t("Batal")}
            </button>
            <button className="profile-save" type="submit" disabled={!canSave}>
              {pending ? t("Menyimpan...") : t("Simpan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
