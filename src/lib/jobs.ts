export type Job = {
  company: string;
  initials: string;
  color: string;
  role: string;
  location: string;
  salary: string;
  match: number;
  tags: string[];
  posted: string;
};

export type Application = {
  company: string;
  role: string;
  date: string;
  status: string;
  tone: string;
  initials: string;
  color: string;
};

export const jobFilters = ["Semua", "Paling cocok", "Remote", "Baru diposting"];
