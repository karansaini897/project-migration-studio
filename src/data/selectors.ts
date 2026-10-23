import type { AppStatus, DemoData, DocStatus } from "./types";

export const APP_STATUSES: AppStatus[] = ["Draft", "Submitted", "Under Review", "Query Raised", "Approved", "Rejected"];
export const DOC_STATUSES: DocStatus[] = ["Verified", "Pending", "Expired", "Flagged"];

export function daysUntil(isoDate: string) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(isoDate); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function scope(data: DemoData, institutionId?: string) {
  if (!institutionId) return data;
  return {
    ...data,
    applications: data.applications.filter((a) => a.institutionId === institutionId),
    documents: data.documents.filter((d) => d.institutionId === institutionId),
    certificates: data.certificates.filter((c) => c.institutionId === institutionId),
    activity: data.activity.filter((a) => a.institutionId === institutionId),
  };
}

export function metrics(d: Pick<DemoData, "applications" | "documents" | "certificates">) {
  const byStatus = Object.fromEntries(APP_STATUSES.map((s) => [s, d.applications.filter((a) => a.status === s).length])) as Record<AppStatus, number>;
  const docsByStatus = Object.fromEntries(DOC_STATUSES.map((s) => [s, d.documents.filter((x) => x.status === s).length])) as Record<DocStatus, number>;
  const expiring = d.certificates.filter((c) => { const n = daysUntil(c.expiresOn); return n >= 0 && n <= 30; });
  const expired = d.certificates.filter((c) => daysUntil(c.expiresOn) < 0);
  return {
    total: d.applications.length,
    pendingReview: byStatus.Submitted + byStatus["Under Review"],
    byStatus,
    docsByStatus,
    expiring,
    expired,
  };
}

export function fmtDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function relTime(isoDate: string) {
  const n = -daysUntil(isoDate);
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  return `${n} days ago`;
}
