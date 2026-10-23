import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/nav";
import { requestPasswordReset } from "@/lib/accounts.functions";
import { AuthLayout, FieldError, FormAlert } from "@/components/portal/auth-layout";

export const Route = createFileRoute("/forgot-password")({
  head: () => pageHead("Forgot password", "Request a password reset link for your portal account."),
  component: Page,
});

function Page() {
  const send = useServerFn(requestPasswordReset);
  const [identifier, setIdentifier] = useState("");
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) { setErr("Enter your username or phone number"); return; }
    setErr(undefined); setFailed(null); setBusy(true);
    try { await send({ data: { identifier, redirectTo: `${window.location.origin}/reset-password` } }); setDone(true); }
    catch { setFailed("Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <AuthLayout>
      <div className="panel p-6 shadow-pop">
        <h1 className="text-lg font-semibold">Reset your password</h1>
        {done ? (
          <div className="mt-4 flex flex-col gap-4">
            <FormAlert tone="info" msg="If this account has a registered email address, a reset link is on its way. Check your inbox and spam folder." />
            <p className="text-sm text-muted-foreground">No email on your account? Ask a portal administrator to set a new password for you.</p>
            <Button asChild variant="outline"><Link to="/">Back to sign in</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">We'll email a reset link to the address on your account.</p>
            <FormAlert msg={failed} />
            <div>
              <Label htmlFor="identifier">Username or phone number</Label>
              <Input id="identifier" className="mt-1.5" value={identifier} onChange={(e) => setIdentifier(e.target.value)} aria-invalid={!!err} />
              <FieldError msg={err} />
            </div>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Send reset link</Button>
            <Link to="/" className="text-center text-xs text-primary hover:underline">Back to sign in</Link>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
