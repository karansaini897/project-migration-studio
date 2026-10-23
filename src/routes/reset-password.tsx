import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/nav";
import { passwordSchema } from "@/lib/account-schema";
import { AuthLayout, FieldError, FormAlert } from "@/components/portal/auth-layout";
import { PasswordInput } from "@/components/portal/password-input";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Choose a new password", "Set a new password for your portal account."),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errs, setErrs] = useState<{ pw?: string | undefined; pw2?: string | undefined }>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setReady(true); });
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setReady((r) => r ?? !!data.session);
    }, 800);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errs = {};
    const p = passwordSchema.safeParse(pw);
    if (!p.success) next.pw = p.error.issues[0]?.message;
    if (pw !== pw2) next.pw2 = "Passwords don't match";
    setErrs(next); setFailed(null);
    if (Object.keys(next).length) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setFailed("Could not update the password. The link may have expired — request a new one."); return; }
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <AuthLayout>
      <div className="panel p-6 shadow-pop">
        <h1 className="text-lg font-semibold">Choose a new password</h1>
        {ready === null ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Checking your reset link…</p>
        ) : !ready ? (
          <div className="mt-4 flex flex-col gap-4">
            <FormAlert msg="This reset link is invalid or has expired." />
            <Button asChild variant="outline"><Link to="/forgot-password">Request a new link</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4">
            <FormAlert msg={failed} />
            <div><Label htmlFor="pw">New password</Label><div className="mt-1.5"><PasswordInput id="pw" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div><FieldError msg={errs.pw} /></div>
            <div><Label htmlFor="pw2">Confirm password</Label><div className="mt-1.5"><PasswordInput id="pw2" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div><FieldError msg={errs.pw2} /></div>
            <p className="text-xs text-muted-foreground">At least 8 characters, including a letter and a number.</p>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Update password</Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
