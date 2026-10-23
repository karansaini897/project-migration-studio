import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/portal/app-shell";

export const Route = createFileRoute("/_portal")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
