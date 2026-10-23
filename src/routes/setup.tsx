import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { pageHead, homeFor } from "@/lib/nav";
import { getSetupStatus, setupFirstAdmin } from "@/lib/accounts.functions";
import { useDemo } from "@/lib/demo-store";
import { AccountForm } from "@/components/portal/account-form";
import { FormAlert } from "@/components/portal/auth-layout";
import { PasswordInput } from "@/components/portal/password-input";
import { useState } from "react";

export const Route = createFileRoute("/setup")({
  head: () => pageHead("First-time setup", "Create the first administrator account for the portal."),
  component: Page,
});

function Page() {
  const status = useServerFn(getSetupStatus);
  const setup = useServerFn(setupFirstAdmin);
  const { signInAccount } = useDemo();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const q = useQuery({ queryKey: ["setup-status"], queryFn: () => status() });

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-xs text-primary hover:underline">← Back to sign in</Link>
        <h1 className="mt-3 text-2xl font-semibold">First-time setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create the first administrator. This works only once, and requires the private setup code held by the portal owner.</p>
        <div className="panel mt-6 p-6">
          {q.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Checking…</p>
            : !q.data?.needsSetup ? (
              <div className="flex flex-col gap-4"><FormAlert tone="info" msg="Setup is already complete. Ask an existing administrator to create your account." /><Button asChild variant="outline"><Link to="/">Go to sign in</Link></Button></div>
            ) : !q.data.configured ? (
              <FormAlert msg="First-admin setup isn't configured yet: the portal owner needs to add a setup code in the backend settings." />
            ) : (
              <AccountForm
                mode="setup" lockRole="admin" submitLabel="Create administrator"
                extra={<div><Label htmlFor="setupCode">Setup code <span className="text-destructive">*</span></Label><div className="mt-1.5"><PasswordInput id="setupCode" value={code} onChange={(e) => setCode(e.target.value)} /></div></div>}
                onSubmit={async (vals) => {
                  const res = await setup({ data: { ...vals, setupCode: code } });
                  if (res.ok) {
                    const s = await signInAccount(String(vals["username"]), String(vals["password"]));
                    navigate({ to: s.ok ? homeFor(s.role) : "/", replace: true });
                  }
                  return res;
                }}
              />
            )}
        </div>
      </div>
    </div>
  );
}
