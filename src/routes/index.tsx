import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABEL, useDemo } from "@/lib/demo-store";
import { DEMO_PERSONA_IDS } from "@/data/mock-data";
import { homeFor, pageHead } from "@/lib/nav";
import { DEMO_CREDENTIALS, checkDemoCredentials } from "@/lib/demo-credentials";
import { AuthLayout, FieldError, FormAlert } from "@/components/portal/auth-layout";
import { PasswordInput } from "@/components/portal/password-input";
import type { Role } from "@/data/types";

const REMEMBER_KEY = "portal.remembered-identifier";

export const Route = createFileRoute("/")({
  head: () => pageHead("Sign in", "Sign in to the AICTE application validation and document authentication portal, or explore with a demo persona."),
  component: Login,
});

const blurbs: Record<Role, string> = {
  admin: "Review applications, verify documents, monitor compliance.",
  institution: "Submit applications, upload documents, respond to queries.",
  faculty: "Maintain qualification records and departmental documents.",
  student: "View notices and upload personal documents.",
};

function Login() {
  const { data, login, user, hydrated } = useDemo();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errs, setErrs] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && user) navigate({ to: homeFor(user.role), replace: true });
  }, [hydrated, user, navigate]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) { setIdentifier(saved); setRemember(true); }
    } catch { /* storage unavailable */ }
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errs = {};
    if (!identifier.trim()) next.identifier = "Enter your username";
    if (!password) next.password = "Enter your password";
    setErrs(next); setFormError(null);
    if (Object.keys(next).length) return;
    const role = checkDemoCredentials(identifier, password);
    if (!role) { setFormError("Incorrect username or password."); return; }
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, identifier.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } catch { /* storage unavailable */ }
    login(DEMO_PERSONA_IDS[role]);
    navigate({ to: homeFor(role), replace: true });
  }

  return (
    <AuthLayout
      aside={
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" /> AICTE Validation Portal · prototype
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Application validation &amp; document authentication, in one workspace.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground">
            Review institutional applications, catch missing or inconsistent documents, and stay ahead of certificate expiry — built for regulatory compliance teams.
          </p>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t pt-6">
            <div><dt className="text-xs text-muted-foreground">Institutions</dt><dd className="text-2xl font-semibold tabular">{data.institutions.length}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Applications</dt><dd className="text-2xl font-semibold tabular">{data.applications.length}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Documents</dt><dd className="text-2xl font-semibold tabular">{data.documents.length}</dd></div>
          </dl>
        </div>
      }
    >
      <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-pop backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Sign in</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Sign in with one of the demo accounts below.</p>
          </div>
        </div>
        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
          <FormAlert msg={formError} />
          <div>
            <Label htmlFor="identifier" className="text-xs font-medium text-muted-foreground">Username</Label>
            <Input
              id="identifier"
              autoComplete="username"
              className="mt-1.5 h-10 rounded-xl border-transparent bg-secondary/70 px-3.5 text-[15px] focus-visible:bg-card"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              aria-invalid={!!errs.identifier}
              placeholder="e.g. admin"
            />
            <FieldError msg={errs.identifier} />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
            <div className="mt-1.5">
              <PasswordInput
                id="password"
                autoComplete="current-password"
                className="h-10 rounded-xl border-transparent bg-secondary/70 px-3.5 text-[15px] focus-visible:bg-card"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errs.password}
              />
            </div>
            <FieldError msg={errs.password} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                aria-label="Remember me on this device"
                className="size-4"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" disabled={!hydrated} className="h-10 rounded-xl text-[15px]">
            Sign in
          </Button>
          <p className="text-xs text-muted-foreground">Accounts are created by portal administrators. <Link to="/setup" className="text-primary hover:underline">First-time setup</Link></p>
        </form>

        <div className="mt-6 border-t pt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Demo Credentials</h3>
            <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">Demo</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Tap an account to fill in its details, then sign in.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.role}
                type="button"
                onClick={() => { setIdentifier(c.username); setPassword(c.password); setErrs({}); setFormError(null); }}
                className="flex flex-col rounded-xl border bg-card p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
                title={blurbs[c.role]}
              >
                <span className="text-xs font-semibold">{ROLE_LABEL[c.role]}</span>
                <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">{c.username} / {c.password}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          Portal records are sample data. Verification outcomes are simulated and are not AICTE or issuing-authority confirmations.
        </p>
      </div>
    </AuthLayout>
  );
}
