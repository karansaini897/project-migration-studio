import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, Empty } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/settings")({
  head: () => pageHead("Settings", "Theme, demo data and preferences."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Theme, demo data and preferences." />
      <Panel><Empty>This section's detailed tools arrive in the next stage.</Empty></Panel>
    </>
  );
}
