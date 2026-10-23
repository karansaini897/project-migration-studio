import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ROLE_LABEL, useDemo } from "@/lib/demo-store";
import { pageHead } from "@/lib/nav";
import { fmtDate, metrics, relTime, scope } from "@/data/selectors";
import { Kpi, PageHeader, Panel, SimulatedTag, StatusBadge } from "@/components/portal/ui-bits";
import { ActivityFeed, ExpiryList } from "@/components/portal/lists";

export const Route = createFileRoute("/_portal/institution")({
  head: () => pageHead("Institution overview", "Your institution’s applications, document status, expiring certificates and notices."),
  component: InstitutionDashboard,
});

function InstitutionDashboard() {
  const { data, user } = useDemo();
  const inst = data.institutions.find((i) => i.id === user?.institutionId);
  const s = useMemo(() => scope(data, user?.institutionId), [data, user?.institutionId]);
  const m = metrics(s);
  const notices = data.notifications.filter((n) => user && n.roles.includes(user.role)).slice(0, 4);
  const isRep = user?.role === "institution";

  return (
    <>
      <PageHeader
        title={inst?.name ?? "Institution"}
        description={`${inst?.city}, ${inst?.state} · ${inst?.aicteId} (fictional ID) · signed in as ${user ? ROLE_LABEL[user.role] : ""}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Applications" value={m.total} hint={`${m.byStatus.Approved} approved`} />
        <Kpi label="In review" value={m.pendingReview} hint={`${m.byStatus["Query Raised"]} query raised`} tone={m.byStatus["Query Raised"] ? "warning" : undefined} />
        <Kpi label="Documents verified" value={`${m.docsByStatus.Verified}/${s.documents.length}`} hint={`${m.docsByStatus.Flagged} flagged (simulated)`} tone={m.docsByStatus.Flagged ? "danger" : "success"} />
        <Kpi label="Expiring in 30 days" value={m.expiring.length} hint={`${m.expired.length} expired`} tone="warning" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Your applications" className="lg:col-span-2" action={isRep ? <Link to="/applications" className="text-xs font-medium text-primary hover:underline">Manage</Link> : undefined}>
          <ul className="divide-y">
            {s.applications.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.type} — {a.programme}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-mono">{a.ref}</span> · updated {relTime(a.updatedOn)} · reviewer {a.reviewer}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden w-28 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${a.completeness}%` }} /></div>
                    <p className="mt-1 text-[11px] text-muted-foreground tabular">{a.completeness}% complete</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Notices">
          <ul className="divide-y">
            {notices.map((n) => (
              <li key={n.id} className="px-5 py-3">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Documents needing attention" action={<SimulatedTag />}>
          <ul className="divide-y">
            {s.documents.filter((d) => d.status !== "Verified").slice(0, 6).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.flagReason ?? `Uploaded ${fmtDate(d.uploadedOn)}`}</p>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Certificate expiry">
          <ExpiryList certs={s.certificates} institutions={data.institutions} />
        </Panel>
        <Panel title="Recent activity">
          <ActivityFeed items={s.activity} institutions={data.institutions} limit={6} />
        </Panel>
      </div>
    </>
  );
}
