import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, Empty } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/verification")({
  head: () => pageHead("Verification & compliance", "Simulated AI and issuer checks on submitted documents."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Verification & compliance" description="Simulated AI and issuer checks on submitted documents." />
      <Panel><Empty>This section's detailed tools arrive in the next stage.</Empty></Panel>
    </>
  );
}
