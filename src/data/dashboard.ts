import type { AppStatus, Application, DemoData } from "./types";
import { daysUntil } from "./selectors";

export type SortKey = "ref" | "institution" | "type" | "submittedOn" | "status";
export interface AppQuery {
  q: string;
  status: AppStatus | "all";
  type: string | "all";
  sort: SortKey;
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const PENDING: AppStatus[] = ["Submitted", "Under Review"];

/** Admin summary card values, all derived from the shared mock dataset. */
export function adminSummary(d: Pick<DemoData, "applications" | "certificates">, windowDays = 30) {
  const count = (s: AppStatus[]) => d.applications.filter((a) => s.includes(a.status)).length;
  return {
    total: d.applications.length,
    pending: count(PENDING),
    approved: count(["Approved"]),
    corrections: count(["Query Raised"]),
    expiringSoon: d.certificates.filter((c) => { const n = daysUntil(c.expiresOn); return n >= 0 && n <= windowDays; }).length,
  };
}

export function queryApplications(apps: Application[], instName: (id: string) => string, q: AppQuery) {
  const term = q.q.trim().toLowerCase();
  const filtered = apps.filter((a) =>
    (q.status === "all" || a.status === q.status) &&
    (q.type === "all" || a.type === q.type) &&
    (!term || [a.ref, instName(a.institutionId), a.type, a.programme].some((v) => v.toLowerCase().includes(term))),
  );
  const val = (a: Application) => (q.sort === "institution" ? instName(a.institutionId) : a[q.sort]);
  const sorted = [...filtered].sort((a, b) => val(a).localeCompare(val(b)) * (q.dir === "asc" ? 1 : -1));
  const pages = Math.max(1, Math.ceil(sorted.length / q.pageSize));
  const page = Math.min(Math.max(1, q.page), pages);
  return { total: sorted.length, pages, page, rows: sorted.slice((page - 1) * q.pageSize, page * q.pageSize) };
}
