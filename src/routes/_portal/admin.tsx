import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, FileStack, FolderOpen, Search, ShieldCheck, CalendarClock, Users } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { pageHead } from "@/lib/nav";
import { APP_STATUSES, DOC_STATUSES, daysUntil, fmtDate, metrics } from "@/data/selectors";
import { adminSummary, PENDING, queryApplications, type AppQuery, type SortKey } from "@/data/dashboard";
import type { AppStatus } from "@/data/types";
import { Kpi, PageHeader, Panel, SimulatedTag, StatusBadge, Empty } from "@/components/portal/ui-bits";
import { ActivityFeed } from "@/components/portal/lists";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_portal/admin")({
  head: () => pageHead("Admin dashboard", "Applications, pending reviews, corrections, verification and certificate expiries at a glance."),
  component: AdminDashboard,
});

const COLS: { key: SortKey; label: string }[] = [
  { key: "ref", label: "Application ID" }, { key: "institution", label: "Institution" }, { key: "type", label: "Category" },
  { key: "submittedOn", label: "Submitted" }, { key: "status", label: "Status" },
];

function AdminDashboard() {
  const { data, user } = useDemo();
  const navigate = useNavigate();
  const s = useMemo(() => adminSummary(data), [data]);
  const m = useMemo(() => metrics(data), [data]);
  const instName = (id: string) => data.institutions.find((i) => i.id === id)?.name ?? "";
  const types = useMemo(() => [...new Set(data.applications.map((a) => a.type))].sort(), [data.applications]);
  const [q, setQ] = useState<AppQuery>({ q: "", status: "all", type: "all", sort: "submittedOn", dir: "desc", page: 1, pageSize: 6 });
  const set = (p: Partial<AppQuery>) => setQ((o) => ({ ...o, page: 1, ...p }));
  const res = queryApplications(data.applications, instName, q);
  const open = (id: string) => navigate({ to: "/applications/$id", params: { id } });

  const queue = data.applications.filter((a) => PENDING.includes(a.status)).sort((a, b) => a.submittedOn.localeCompare(b.submittedOn)).slice(0, 5);
  const alerts = data.certificates.filter((c) => daysUntil(c.expiresOn) <= 30).sort((a, b) => a.expiresOn.localeCompare(b.expiresOn)).slice(0, 5);
  const docTotal = data.documents.length;

  return (
    <>
      <PageHeader title={`Good day, ${user?.name.split(" ")[0] ?? ""}`} description="Admin dashboard · all figures are derived from the fictional demo dataset." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Total applications" value={s.total} hint={`${data.institutions.length} institutions`} />
        <Kpi label="Pending reviews" value={s.pending} hint="Submitted or under review" tone="info" />
        <Kpi label="Approved" value={s.approved} hint={s.total ? `${Math.round((s.approved / s.total) * 100)}% of total` : undefined} tone="success" />
        <Kpi label="Needing corrections" value={s.corrections} hint="Query raised" tone="warning" />
        <Kpi label="Expiring in 30 days" value={s.expiringSoon} hint={`${m.expired.length} already expired`} tone="danger" />
      </div>

      <Panel title="Recent applications" className="mt-4">
        <div className="flex flex-col gap-2 border-b px-5 py-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search ID, institution, category…" className="pl-9" aria-label="Search applications" />
          </div>
          <Select value={q.status} onValueChange={(v) => set({ status: v as AppStatus | "all" })}>
            <SelectTrigger className="md:w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{APP_STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={q.type} onValueChange={(v) => set({ type: v })}>
            <SelectTrigger className="md:w-48" aria-label="Filter by category"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{types.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                {COLS.map((c) => (
                  <th key={c.key} className="px-4 py-2.5 font-medium first:pl-5">
                    <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setQ((o) => ({ ...o, sort: c.key, dir: o.sort === c.key && o.dir === "asc" ? "desc" : "asc" }))}>
                      {c.label}{q.sort === c.key && (q.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {res.rows.map((a) => (
                <tr key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => open(a.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") open(a.id); }}>
                  <td className="whitespace-nowrap py-3 pl-5 pr-4 font-mono text-xs">{a.ref}</td>
                  <td className="max-w-60 truncate px-4 py-3">{instName(a.institutionId)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{a.type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(a.submittedOn)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link to="/applications/$id" params={{ id: a.id }} onClick={(e) => e.stopPropagation()} className="text-xs font-medium text-primary hover:underline">
                      {PENDING.includes(a.status) ? "Review" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!res.rows.length && <Empty>No applications match these filters.</Empty>}
        </div>
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
          <span>{res.total} application{res.total === 1 ? "" : "s"} · page {res.page} of {res.pages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={res.page <= 1} onClick={() => setQ((o) => ({ ...o, page: res.page - 1 }))} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" disabled={res.page >= res.pages} onClick={() => setQ((o) => ({ ...o, page: res.page + 1 }))} aria-label="Next page"><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title={`Pending review queue (${s.pending})`}>
          {queue.length ? (
            <ul className="divide-y">
              {queue.map((a) => (
                <li key={a.id}>
                  <Link to="/applications/$id" params={{ id: a.id }} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{instName(a.institutionId)}</p><p className="text-xs text-muted-foreground"><span className="font-mono">{a.ref}</span> · waiting {-daysUntil(a.submittedOn)} days</p></div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty>Queue is clear.</Empty>}
        </Panel>
        <Panel title="Expiry alerts" action={<Link to="/calendar" className="text-xs font-medium text-primary hover:underline">Calendar</Link>}>
          {alerts.length ? (
            <ul className="divide-y">
              {alerts.map((c) => {
                const n = daysUntil(c.expiresOn);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{c.name}</p><p className="truncate text-xs text-muted-foreground">{instName(c.institutionId)}</p></div>
                    <StatusBadge status={n < 0 ? `Expired ${-n}d ago` : `${n}d left`} tone={n < 0 ? "danger" : "warning"} />
                  </li>
                );
              })}
            </ul>
          ) : <Empty>No certificates expiring soon.</Empty>}
        </Panel>
        <Panel title="Verification summary" action={<SimulatedTag />}>
          <div className="space-y-4 p-5">
            {DOC_STATUSES.map((st) => {
              const n = m.docsByStatus[st];
              const pct = docTotal ? Math.round((n / docTotal) * 100) : 0;
              return (
                <div key={st}>
                  <div className="mb-1.5 flex items-center justify-between text-sm"><StatusBadge status={st} /><span className="tabular text-muted-foreground">{n} · {pct}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            <p className="pt-1 text-[11px] text-muted-foreground">{docTotal} documents across {data.institutions.length} institutions.</p>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Recent activity" className="lg:col-span-2" action={<Link to="/reports" className="text-xs font-medium text-primary hover:underline">Full history</Link>}>
          <ActivityFeed items={data.activity} institutions={data.institutions} limit={6} />
        </Panel>
        <Panel title="Quick actions">
          <div className="grid grid-cols-2 gap-2 p-5">
            {([
              { to: "/applications", label: "Applications", icon: FileStack },
              { to: "/verification", label: "Verify documents", icon: ShieldCheck },
              { to: "/documents", label: "Documents", icon: FolderOpen },
              { to: "/calendar", label: "Expiry calendar", icon: CalendarClock },
              { to: "/accounts", label: "Manage accounts", icon: Users },
            ] as const).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/50">
                <Icon className="size-4 text-primary" /> {label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
