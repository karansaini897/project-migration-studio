import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { pageHead } from "@/lib/nav";
import { fmtDate } from "@/data/selectors";
import { Empty, PageHeader, Panel, SimulatedTag, StatusBadge } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/applications_/$id")({
  head: () => pageHead("Application details", "Application status, details and supporting documents."),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data } = useDemo();
  const a = data.applications.find((x) => x.id === id);
  const back = <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-xs text-primary hover:underline"><ArrowLeft className="size-3" /> Back to dashboard</Link>;
  if (!a) return <>{back}<Panel><Empty>Application not found.</Empty></Panel></>;
  const inst = data.institutions.find((i) => i.id === a.institutionId);
  const docs = data.documents.filter((d) => d.applicationId === a.id);
  const rows: [string, string][] = [
    ["Application ID", a.ref], ["Institution", inst?.name ?? ""], ["Category", a.type], ["Programme", a.programme],
    ["Submitted", fmtDate(a.submittedOn)], ["Last updated", fmtDate(a.updatedOn)], ["Reviewer", a.reviewer], ["Completeness", `${a.completeness}%`],
  ];
  return (
    <>
      {back}
      <PageHeader title={`${a.type} — ${a.programme}`} description={`${a.ref} · ${inst?.name ?? ""}`} actions={<StatusBadge status={a.status} />} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Details">
          <dl className="divide-y">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-2.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        </Panel>
        <Panel title={`Documents (${docs.length})`} className="lg:col-span-2" action={<SimulatedTag />}>
          {docs.length ? (
            <ul className="divide-y">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.category} · {d.issuer}{d.flagReason ? ` · ${d.flagReason}` : ""}</p></div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          ) : <Empty>No documents uploaded.</Empty>}
        </Panel>
      </div>
    </>
  );
}
