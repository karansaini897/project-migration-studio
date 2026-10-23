import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, Empty } from "@/components/portal/ui-bits";

export const Route = createFileRoute("/_portal/documents")({
  head: () => pageHead("Document repository", "Browse and preview uploaded institutional documents."),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : undefined }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Document repository" description="Browse and preview uploaded institutional documents." />
      <Panel><Empty>This section's detailed tools arrive in the next stage.</Empty></Panel>
    </>
  );
}
