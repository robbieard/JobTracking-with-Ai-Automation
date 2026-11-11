"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

type Language = "id" | "en";
type Theme = "light" | "dark";

type Preferences = {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (text: string) => string;
};

const translations: Record<string, string> = {
  "Mulai dari langkah berikutnya.": "Start with your next step.",
  "Masuk atau buat akun untuk mengelola pencarian kerjamu.": "Sign in or create an account to manage your job search.",
  "Kembali ke beranda": "Back to home",
  "Pencarian kerja lebih terarah": "A more focused job search",
  "Masuk atau daftar | JobTracking": "Sign in or create an account | JobTracking",
  "SELAMAT DATANG KEMBALI": "WELCOME BACK",
  "AKUN JOBTRACKING": "JOBTRACKING ACCOUNT",
  "Login ke": "Log in to",
  "Mulai dari": "Start with",
  "email kamu.": "your email.",
  "JobTracking.": "JobTracking.",
  "Cek kotak": "Check your",
  "masukmu.": "inbox.",
  "Jika alamat ini baru, kode verifikasi dikirim ke ": "If this is a new email, a verification code was sent to ",
  ". Masukkan kode untuk melanjutkan.": ". Enter the code to continue.",
  "Buat password": "Create a password",
  "yang aman.": "that's secure.",
  "Satu langkah": "One more",
  "lagi.": "step.",
  "Masuk dengan email dan password akunmu.": "Log in with your account email and password.",
  "Daftar dengan email baru. Kami akan kirim kode untuk verifikasi alamat email.": "Create an account with a new email. We'll send a code to verify the address.",
  "Masukkan email untuk masuk atau membuat akun. Kami akan kirim kode verifikasi.": "Enter your email to log in or create an account. We'll send a verification code.",
  "Emailmu sudah terverifikasi. Buat password untuk mengamankan akun.": "Your email is verified. Create a password to secure your account.",
  "Email terverifikasi. Masukkan password akunmu untuk melanjutkan.": "Email verified. Enter your account password to continue.",
  "Data akunmu hanya digunakan untuk perjalanan kariermu.": "Your account data is only used for your career journey.",
  "Alamat email": "Email address",
  "Password": "Password",
  "Masukkan password": "Enter your password",
  "Gunakan email yang bisa kamu akses sekarang.": "Use an email you can access right now.",
  "Email atau password mungkin salah.": "Email or password might be wrong.",
  "Memeriksa konfigurasi auth...": "Checking auth configuration...",
  "Kirim kode verifikasi": "Send verification code",
  "Buat akun dan kirim kode": "Create account and send code",
  "Mengirim kode...": "Sending code...",
  "Memverifikasi...": "Verifying...",
  "Memproses...": "Processing...",
  "Login": "Log in",
  "Sign in": "Sign up",
  "Belum punya akun?": "Don't have an account?",
  "Sudah punya akun?": "Already have an account?",
  "Kode verifikasi": "Verification code",
  "Kode berlaku untuk sesi ini": "Code expires in",
  "Belum menerima kode? Kamu bisa kirim ulang.": "Didn't receive the code? You can request another.",
  "Verifikasi email": "Verify email",
  "Kirim ulang kode": "Resend code",
  "Kode verifikasi baru akan dikirim.": "A new verification code will be sent.",
  "Jika email ini belum diverifikasi, kode baru akan dikirim.": "If this email is not verified yet, a new code will be sent.",
  "Jika email ini belum terdaftar, kode verifikasi akan dikirim. Sudah punya akun? Pilih Login.": "If this is a new email, a verification code will be sent. Already have an account? Choose Log in.",
  "Masukkan kode verifikasi 6-10 digit dari emailmu.": "Enter the 6–10 digit verification code from your email.",
  "Email belum berhasil diverifikasi. Periksa kode dan coba lagi.": "Email verification failed. Check the code and try again.",
  "Gunakan password minimal 8 karakter.": "Use a password with at least 8 characters.",
  "Minimal 8 karakter. Simpan baik-baik, ya.": "At least 8 characters. Keep it somewhere safe.",
  "Selesaikan verifikasi hCaptcha terlebih dahulu.": "Complete the hCaptcha check first.",
  "Auth belum siap. Lengkapi: ": "Auth isn't ready. Complete: ",
  "site key hCaptcha": "hCaptcha site key",
  "API auth tidak dapat diperiksa": "Unable to check auth status",
  "Status auth tidak tersedia.": "Auth status is unavailable.",
  "Password akun": "Account password",
  "Konfirmasi email di Supabase perlu diaktifkan untuk pendaftaran akun.": "Email confirmation must be enabled in Supabase to create accounts.",
  "Terjadi kendala. Coba lagi sebentar.": "Something went wrong. Please try again.",
  "Masuk ke JobTracking": "Log in to JobTracking",
  "Simpan password": "Save password",
  "Buat akun dan kirim kode verifikasi": "Create account and send verification code",
  "Kembali": "Back",
  "Dengan melanjutkan, kamu menyetujui ": "By continuing, you agree to the ",
  "Ketentuan Layanan": "Terms of Service",
  " dan ": " and ",
  "Kebijakan Privasi": "Privacy Policy",
  "Dikembangkan oleh RBDev": "Developed by RBDev",
  "JOBTRACKING ": "JOBTRACKING ",
  "by": "by",
  "Workspace": "Workspace",
  "Dashboard": "Dashboard",
  "Navigasi utama": "Main navigation",
  "Cari lowongan": "Find jobs",
  "Lamaran saya": "My applications",
  "Profil & CV": "Profile & CV",
  "AI kamu aktif": "Your AI is active",
  "Profil diperbarui 2 hari lalu": "Profile updated 2 days ago",
  "Pusat bantuan": "Help center",
  "Pengaturan": "Settings",
  "Pengaturan profil": "Profile settings",
  "Keluar": "Log out",
  "SELASA, 14 OKTOBER 2025": "TUESDAY, OCTOBER 14, 2025",
  "Selamat pagi, Aditya ": "Good morning, Aditya ",
  "Ada peluang baru yang cocok buat langkahmu berikutnya.": "There are new opportunities that could be right for your next step.",
  "Perbarui CV": "Update CV",
  "Unggah CV akan segera tersedia.": "CV upload is coming soon.",
  "Total lamaran": "Total applications",
  "dibanding minggu lalu": "compared with last week",
  "Interview": "Interview",
  "Wawancara": "Interview",
  "1 jadwal minggu ini": "1 scheduled this week",
  "Rata-rata kecocokan": "Average match",
  "profilmu makin relevan": "your profile is getting more relevant",
  "Lowongan untukmu": "Jobs for you",
  "12 baru": "12 new",
  "Dikurasi AI berdasarkan profil dan preferensimu": "Curated by AI based on your profile and preferences",
  "Lihat semua": "View all",
  "Semua lowongan akan segera tersedia.": "All jobs will be available soon.",
  "Cari posisi, perusahaan, atau skill": "Search roles, companies, or skills",
  "Semua": "All",
  "Paling cocok": "Best match",
  "Remote": "Remote",
  "Baru diposting": "Recently posted",
  "Pengaturan filter": "Filter settings",
  "Filter lanjutan segera tersedia.": "Advanced filters are coming soon.",
  "cocok": "match",
  "Simpan lowongan": "Save job",
  "Hapus lowongan tersimpan": "Remove saved job",
  "Draft lamaran ": "Application draft for ",
  " akan disiapkan.": " will be prepared.",
  "Belum ada lowongan yang cocok": "No matching jobs found",
  "Coba kata kunci atau filter lainnya.": "Try another keyword or filter.",
  "Aktivitas lamaran": "Application activity",
  "7 hari terakhir": "Last 7 days",
  "Pantau setiap langkah proses rekrutmenmu": "Track every step of your recruitment process",
  "Semua lamaran": "All applications",
  "Riwayat lamaran akan segera tersedia.": "Application history is coming soon.",
  "Berlangsung": "In progress",
  "Perlu tindakan": "Action needed",
  "Status lamaran": "Application status",
  "PERUSAHAAN": "COMPANY",
  "POSISI": "ROLE",
  "TANGGAL": "DATE",
  "STATUS": "STATUS",
  "Ditinjau": "In review",
  "Terkirim": "Sent",
  "Lihat semua lamaran": "View all applications",
  "Semua lowongan dikurasi sesuai preferensimu.": "Jobs are curated to match your preferences.",
  "Atur preferensi": "Set preferences",
  "Preferensi rekomendasi segera tersedia.": "Recommendation preferences are coming soon.",
  "Kamu sudah up to date.": "You're all caught up.",
  "Pengaturan profil segera tersedia.": "Profile settings are coming soon.",
  "Status ": "Status for ",
  "Detail ": "Details for ",
  ": ": ": ",
  "WORKSPACE": "WORKSPACE",
  "Notifikasi": "Notifications",
  "Ringkasan aktivitas": "Activity summary",
  "Filter lowongan": "Job filters",
  "Jakarta · Hybrid": "Jakarta · Hybrid",
  "Remote · Indonesia": "Remote · Indonesia",
  "2 jam lalu": "2 hours ago",
  "5 jam lalu": "5 hours ago",
  "Kemarin": "Yesterday",
  "12 Okt": "Oct 12",
  "10 Okt": "Oct 10",
  "08 Okt": "Oct 08",
  "Semua status": "All statuses",
  "baru": "new",
  "Login ke JobTracking": "Log in to JobTracking",
  "Pengaturan tampilan dan bahasa": "Display and language settings",
  "Pilih bahasa": "Choose language",
  "Ganti ke ": "Switch to ",
  "tema gelap": "dark theme",
  "tema terang": "light theme",
  "Tema gelap": "Dark theme",
  "Tema terang": "Light theme",
  "Selamat pagi, ": "Good morning, ",
  "CARI LOWONGAN": "FIND JOBS",
  "Temukan peran berikutnya, ": "Find your next role, ",
  "Semua lowongan yang tersedia untukmu saat ini.": "All jobs currently available for you.",
  "Kembali ke dashboard": "Back to dashboard",
  "Semua lowongan": "All jobs",
  "Cari dan filter lowongan sesuai preferensimu": "Search and filter jobs that fit your preferences",
  "Edit profil": "Edit profile",
  "Kelola informasi akunmu.": "Manage your account information.",
  "Tutup": "Close",
  "Nama tampilan": "Display name",
  "Nama ini akan tampil di dashboard.": "This name appears on your dashboard.",
  "Email": "Email",
  "Email tidak dapat diubah.": "Email cannot be changed.",
  "Nama berhasil diperbarui.": "Your name has been updated.",
  "Nama minimal 2 karakter.": "Name must be at least 2 characters.",
  "Nama maksimal 60 karakter.": "Name must be at most 60 characters.",
  "Sesi kamu sudah berakhir. Silakan masuk lagi.": "Your session has ended. Please sign in again.",
  "Nama gagal diperbarui. Coba lagi.": "Couldn't update your name. Please try again.",
  "Menyimpan...": "Saving...",
  "Simpan": "Save",
  "Batal": "Cancel",
  "Memuat dashboard...": "Loading dashboard...",
  "Halo, ": "Hi, ",
  "RINGKASAN HARI INI": "TODAY'S SUMMARY",
  "Belum ada data": "No data yet",
  "Belum ada lowongan": "No jobs yet",
  "Lowongan akan muncul di sini setelah tersedia.": "Jobs will appear here once available.",
  "Belum ada lamaran": "No applications yet",
  "Lamaran yang kamu kirim akan muncul di sini.": "Applications you submit will appear here.",
  "Ringkasan aktivitas pencarian kerjamu.": "A summary of your job search activity.",
  "Rekomendasi lowongan berdasarkan profilmu.": "Job recommendations based on your profile.",
  "AI MONITORING": "AI MONITORING",
  "AI Monitoring": "AI Monitoring",
  "Pantau performa dan aktivitas AI kamu di sini.": "Monitor your AI performance and activity here.",
  "Belum ada aktivitas AI": "No AI activity yet",
  "Data monitoring akan muncul setelah AI mulai digunakan.": "Monitoring data will appear once the AI is in use.",
  "AI Control Center": "AI Control Center",
  "Pantau model, agent, dan performa AI yang bekerja untuk pencarian kerjamu.": "Monitor the models, agents, and AI performance powering your job search.",
  "Live": "Live",
  "Data contoh": "Sample data",
  "Data contoh untuk preview frontend.": "Sample data for the frontend preview.",
  "Refresh": "Refresh",
  "Data monitoring diperbarui.": "Monitoring data refreshed.",
  "Ringkasan performa AI": "AI performance summary",
  "Total request": "Total requests",
  "vs minggu lalu": "vs last week",
  "Success rate": "Success rate",
  "request gagal": "failed requests",
  "Rata-rata latensi": "Average latency",
  "Groq paling cepat (0.42s)": "Groq is the fastest (0.42s)",
  "Estimasi biaya": "Estimated cost",
  "Model & provider": "Models & providers",
  "aktif": "active",
  "Model yang saat ini terhubung ke sistem.": "Models currently connected to the system.",
  "Terakhir diperbarui 2 menit lalu": "Updated 2 minutes ago",
  "Operational": "Operational",
  "Degraded": "Degraded",
  "Request": "Requests",
  "Latensi": "Latency",
  "Sukses": "Success",
  "token": "tokens",
  "Penalaran & pencocokan lowongan": "Reasoning & job matching",
  "Screening cepat & ringkasan": "Fast screening & summaries",
  "Fallback & routing model": "Fallback & model routing",
  "Klasifikasi di edge": "Edge classification",
  "Volume request AI": "AI request volume",
  "Request per hari, 7 hari terakhir": "Requests per day, last 7 days",
  "Distribusi penggunaan": "Usage distribution",
  "Berdasarkan total request": "Based on total requests",
  "Per provider, 7 hari terakhir": "Per provider, last 7 days",
  "Agent pipeline": "Agent pipeline",
  "Agent yang berjalan di balik layar": "Agents running behind the scenes",
  "Job Matcher": "Job Matcher",
  "Mencocokkan lowongan dengan profil": "Matches jobs with your profile",
  "Resume Screener": "Resume Screener",
  "Menyaring CV dan ringkasan kandidat": "Screens resumes and summarizes candidates",
  "Application Writer": "Application Writer",
  "Menyusun draft lamaran": "Writes application drafts",
  "Inbox Classifier": "Inbox Classifier",
  "Mengklasifikasi email masuk": "Classifies incoming emails",
  "Fallback Router": "Fallback Router",
  "Routing ke model cadangan": "Routes to fallback models",
  "Aktif": "Active",
  "Siaga": "Standby",
  "Aktivitas terbaru": "Recent activity",
  "Log request AI terakhir": "Latest AI request logs",
  "event": "events",
  "Waktu": "Time",
  "Provider & model": "Provider & model",
  "Event": "Event",
  "Status": "Status",
  "Berhasil": "Success",
  "Gagal": "Failed",
  "Berjalan": "Running",
  "Job matching": "Job matching",
  "Resume screening": "Resume screening",
  "Application draft": "Application draft",
  "Inbox classification": "Inbox classification",
  "Fallback routing": "Fallback routing",
  "Token": "Tokens",
  "Test koneksi": "Test connection",
  "Menguji...": "Testing...",
  "provider aktif": "active providers",
  "Estimasi dari harga model": "Estimated from model pricing",
  "terkonfigurasi": "configured",
  "Terakhir": "Last",
  "Belum ada telemetry": "No telemetry yet",
  "Belum dikonfigurasi": "Not configured",
  "Siap": "Ready",
  "Belum siap": "Not ready",
  "Jalankan test koneksi untuk mulai mengumpulkan data.": "Run a connection test to start collecting data.",
  "Semua provider terhubung.": "All providers are connected.",
  "Sebagian provider gagal.": "Some providers failed.",
  "Belum ada provider yang dikonfigurasi.": "No providers are configured yet.",
  "Gagal menjalankan test koneksi.": "Failed to run the connection test.",
  "Job ingestion": "Job ingestion",
  "Email alert": "Email alert",
  "Health check": "Health check",
  "Error": "Error",
  "Tidak diketahui": "Unknown",
  "Tanpa detail": "No detail",
};

const PreferencesContext = createContext<Preferences | null>(null);

function subscribePreferences(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("jobtracking-preferences", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("jobtracking-preferences", callback);
  };
}

function readLanguage(): Language {
  return localStorage.getItem("jobtracking-language") === "en" ? "en" : "id";
}

function readTheme(): Theme {
  return localStorage.getItem("jobtracking-theme") === "dark" ? "dark" : "light";
}

function updatePreference(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event("jobtracking-preferences"));
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore<Language>(subscribePreferences, readLanguage, () => "id");
  const theme = useSyncExternalStore<Theme>(subscribePreferences, readTheme, () => "light");

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
  }, [language, theme]);

  const value: Preferences = {
    language,
    theme,
    setLanguage: (nextLanguage) => updatePreference("jobtracking-language", nextLanguage),
    setTheme: (nextTheme) => updatePreference("jobtracking-theme", nextTheme),
    t: (text) => language === "en" ? (translations[text] ?? text) : text,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  return context;
}

export function PreferenceControls() {
  const { language, theme, setLanguage, setTheme, t } = useAppPreferences();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <div className="preference-controls" aria-label={t("Pengaturan tampilan dan bahasa")}>
      <div className="language-switch" role="group" aria-label={t("Pilih bahasa")}>
        <button type="button" className={language === "id" ? "selected" : ""} aria-pressed={language === "id"} onClick={() => setLanguage("id")}>ID</button>
        <button type="button" className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
      </div>
      <button
        type="button"
        className="theme-switch"
        aria-label={t("Ganti ke ") + t(nextTheme === "dark" ? "tema gelap" : "tema terang")}
        title={t(nextTheme === "dark" ? "Tema gelap" : "Tema terang")}
        onClick={() => setTheme(nextTheme)}
      >
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </div>
  );
}
