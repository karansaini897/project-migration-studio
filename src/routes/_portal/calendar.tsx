import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, Empty } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/calendar")({
  head: () => pageHead("Expiry calendar", "Certificate expiry dates and reminders."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Expiry calendar" description="Certificate expiry dates and reminders." />
      <Panel><Empty>This section's detailed tools arrive in the next stage.</Empty></Panel>
    </>
  );
}
