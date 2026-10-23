import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, initials } from "@/components/portal/ui-bits";
import { ROLE_LABEL, useDemo } from "@/lib/demo-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_portal/profile")({
  head: () => pageHead("Profile", "Your account details and role information."),
  component: Page,
});

const pretty = (s: string | null | undefined) => (s ? s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : null);

function Page() {
  const { user, account, isDemo } = useDemo();
  if (!user) return null;
  const rows: [string, string | number | null | undefined][] = account ? [
    ["Username", `@${account.username}`], ["Phone", account.phone], ["Email", account.email],
    ["Date of birth", account.dateOfBirth], ["Age", account.age], ["Gender", pretty(account.gender)], ["Account status", pretty(account.status)],
    ...(account.role === "student" ? [["Roll number", account.rollNumber], ["Institution", account.institutionName], ["Course", account.course], ["Department", account.department], ["Year / semester", account.yearSemester]] as [string, string | null][] : []),
    ...(account.role === "faculty" ? [["Employee ID", account.employeeId], ["Institution", account.institutionName], ["Department", account.department], ["Designation", account.designation], ["Joining date", account.joiningDate]] as [string, string | null][] : []),
    ...(account.role === "institution" ? [["Institution", account.institutionName], ["Institution identifier", account.institutionCode], ["Designation", account.designation], ["Authorization", pretty(account.authorizationStatus)]] as [string, string | null][] : []),
    ...(account.role === "admin" ? [["Designation", account.designation], ["Permission level", pretty(account.permissionLevel)]] as [string, string | null][] : []),
  ] : [["Username", `@${user.username}`], ["Phone", user.phone], ["Email", user.email], ["Title", user.title]];

  return (
    <>
      <PageHeader title="Profile" description={isDemo ? "Fictional demo persona details." : "Your account details. Contact an administrator to change them."} />
      <Panel>
        <div className="flex items-center gap-4 border-b p-5">
          <Avatar className="size-14">
            {user.photo && <AvatarImage src={user.photo} alt={user.name} />}
            <AvatarFallback className="bg-accent font-semibold text-accent-foreground">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{ROLE_LABEL[user.role]}{isDemo ? " · Demo persona" : ""}</p>
          </div>
        </div>
        <dl className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm">{v ?? "—"}</dd></div>
          ))}
        </dl>
      </Panel>
    </>
  );
}
