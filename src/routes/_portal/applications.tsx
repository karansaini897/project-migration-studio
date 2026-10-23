import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, Empty } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/applications")({
  head: () => pageHead("Applications", "Create, track and review institutional applications."),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : undefined }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Applications" description="Create, track and review institutional applications." />
      <Panel><Empty>This section's detailed tools arrive in the next stage.</Empty></Panel>
    </>
  );
}
