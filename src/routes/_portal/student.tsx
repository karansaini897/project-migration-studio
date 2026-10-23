import { createFileRoute, Link } from "@tanstack/react-router";
import { ROLE_LABEL, useDemo } from "@/lib/demo-store";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/student")({
  head: () => pageHead("Student dashboard", "Your notices and personal documents."),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { data, user } = useDemo();
  const notices = data.notifications.filter((n) => user && n.roles.includes(user.role)).slice(0, 4);
  return (
    <>
      <PageHeader title={`Welcome, ${user?.name ?? ""}`} description={`Signed in as ${user ? ROLE_LABEL[user.role] : ""}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Quick links" className="lg:col-span-2">
          <ul className="divide-y">
            <li className="px-5 py-3"><Link to="/documents" className="text-sm font-medium text-primary hover:underline">My documents</Link></li>
            <li className="px-5 py-3"><Link to="/profile" className="text-sm font-medium text-primary hover:underline">My profile</Link></li>
          </ul>
        </Panel>
        <Panel title="Notices">
          <ul className="divide-y">
            {notices.length ? notices.map((n) => (
              <li key={n.id} className="px-5 py-3"><p className="text-sm font-medium">{n.title}</p></li>
            )) : <li className="px-5 py-3 text-sm text-muted-foreground">No notices right now.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
