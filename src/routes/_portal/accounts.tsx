import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/nav";
import { PageHeader, Panel, Empty, StatusBadge } from "@/components/portal/ui-bits";
import { createAccount, listAccounts, setAccountPassword, updateAccount } from "@/lib/accounts.functions";
import type { AccountRow } from "@/lib/account-schema";
import { ROLE_LABEL, useDemo } from "@/lib/demo-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AccountForm, fromAccount } from "@/components/portal/account-form";
import { PasswordInput } from "@/components/portal/password-input";
import { FieldError } from "@/components/portal/auth-layout";
import type { Role } from "@/data/types";

export const Route = createFileRoute("/_portal/accounts")({
  head: () => pageHead("Accounts", "Admin-managed portal accounts and roles."),
  component: Page,
});

const statusTone = { active: "success", suspended: "danger", pending: "warning" } as const;

function Page() {
  const { isDemo } = useDemo();
  const qc = useQueryClient();
  const fetchAccounts = useServerFn(listAccounts);
  const create = useServerFn(createAccount);
  const update = useServerFn(updateAccount);
  const q = useQuery({ queryKey: ["accounts"], queryFn: () => fetchAccounts(), enabled: !isDemo });
  const [dialog, setDialog] = useState<{ kind: "create" } | { kind: "edit"; acc: AccountRow } | { kind: "password"; acc: AccountRow } | null>(null);
  const [filter, setFilter] = useState<Role | "all">("all");
  const close = () => setDialog(null);
  const rows = (q.data ?? []).filter((a) => filter === "all" || a.role === filter);

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Create and manage portal accounts. Usernames and phone numbers are unique across all roles."
        actions={!isDemo && <Button onClick={() => setDialog({ kind: "create" })}><UserPlus className="size-4" /> New account</Button>}
      />
      <Panel>
        {isDemo ? <Empty>Account management needs a real admin sign-in, not a demo persona.</Empty>
          : q.isLoading ? <Empty>Loading accounts…</Empty>
          : q.isError ? <Empty>You don't have access to account management.</Empty>
          : (
            <>
              <div className="flex flex-wrap gap-1.5 border-b p-3">
                {(["all", "admin", "institution", "faculty", "student"] as const).map((r) => (
                  <Button key={r} size="sm" variant={filter === r ? "secondary" : "ghost"} onClick={() => setFilter(r)}>{r === "all" ? "All" : ROLE_LABEL[r]}</Button>
                ))}
              </div>
              {!rows.length ? <Empty>No accounts here yet.</Empty> : (
                <ul className="divide-y">
                  {rows.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                      <span className="min-w-0">
                        <strong>{a.fullName}</strong> <span className="text-muted-foreground">@{a.username} · {a.phone}{a.email ? ` · ${a.email}` : ""}</span>
                        <span className="block text-xs text-muted-foreground">{ROLE_LABEL[a.role]}{a.institutionName ? ` · ${a.institutionName}` : ""}{a.age !== null ? ` · Age ${a.age}` : ""}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusBadge status={a.status} tone={statusTone[a.status as keyof typeof statusTone]} />
                        <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "edit", acc: a })}><Pencil className="size-3.5" /> Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "password", acc: a })}><KeyRound className="size-3.5" /> Password</Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
      </Panel>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {dialog?.kind === "create" && <>
            <DialogHeader><DialogTitle>New account</DialogTitle><DialogDescription>Fields change with the selected role.</DialogDescription></DialogHeader>
            <AccountForm mode="create" submitLabel="Create account" onSubmit={async (vals) => {
              const res = await create({ data: vals });
              if (res.ok) { toast.success("Account created"); close(); void qc.invalidateQueries({ queryKey: ["accounts"] }); }
              return res;
            }} />
          </>}
          {dialog?.kind === "edit" && <>
            <DialogHeader><DialogTitle>Edit {dialog.acc.fullName}</DialogTitle><DialogDescription>Changes apply immediately.</DialogDescription></DialogHeader>
            <AccountForm mode="edit" initial={fromAccount(dialog.acc)} submitLabel="Save changes" onSubmit={async (vals) => {
              const res = await update({ data: { ...vals, id: dialog.acc.id } });
              if (res.ok) { toast.success("Account updated"); close(); void qc.invalidateQueries({ queryKey: ["accounts"] }); }
              return res;
            }} />
          </>}
          {dialog?.kind === "password" && <SetPassword acc={dialog.acc} onDone={close} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SetPassword({ acc, onDone }: { acc: AccountRow; onDone: () => void }) {
  const setPw = useServerFn(setAccountPassword);
  const [pw, setPwVal] = useState("");
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <DialogHeader><DialogTitle>Set a new password</DialogTitle><DialogDescription>For {acc.fullName} (@{acc.username}). Share it with them securely.</DialogDescription></DialogHeader>
      <form className="flex flex-col gap-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(undefined);
        try { const r = await setPw({ data: { id: acc.id, password: pw } }); if (r.ok) { toast.success("Password updated"); onDone(); } else setErr(r.error); }
        catch { setErr("You don't have permission to do this."); }
        finally { setBusy(false); }
      }}>
        <div><Label htmlFor="newpw">New password</Label><div className="mt-1.5"><PasswordInput id="newpw" value={pw} onChange={(e) => setPwVal(e.target.value)} autoComplete="new-password" /></div><FieldError msg={err} /></div>
        <div className="flex justify-end"><Button type="submit" disabled={busy}>Set password</Button></div>
      </form>
    </>
  );
}
