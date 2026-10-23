import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, Empty } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/reports")({
  head: () => pageHead("Reports & activity", "Application metrics and full activity history."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Reports & activity" description="Application metrics and full activity history." />
      <Panel><Empty>This section's detailed tools arrive in the next stage.</Empty></Panel>
    </>
  );
}
