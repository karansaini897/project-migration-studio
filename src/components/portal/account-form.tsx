import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_STATUSES, GENDERS, PERMISSION_LEVELS, ROLES, STATUSES, ageFrom, type AccountRow } from "@/lib/account-schema";
import { ROLE_LABEL } from "@/lib/demo-store";
import type { Role } from "@/data/types";
import { FieldError, FormAlert } from "./auth-layout";
import { PasswordInput } from "./password-input";

export type FormValues = Record<string, string>;
export type SubmitResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> | undefined };

const pretty = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function fromAccount(a: AccountRow): FormValues {
  const out: FormValues = {};
  for (const [k, v] of Object.entries(a)) if (typeof v === "string") out[k] = v;
  out["phone"] = a.phone.replace(/^\+91/, "");
  return out;
}

function Select({ id, value, onChange, options, placeholder }: { id: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; labels?: Record<string, string> }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40">
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{pretty(o)}</option>)}
    </select>
  );
}

export function AccountForm({
  initial, mode, lockRole, submitLabel, onSubmit, extra,
}: {
  initial?: FormValues; mode: "create" | "edit" | "setup"; lockRole?: Role; submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => Promise<SubmitResult>; extra?: ReactNode;
}) {
  const [v, setV] = useState<FormValues>({ role: lockRole ?? "student", status: "active", ...initial });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<{ data: string; type: string } | null>(null);
  const set = (k: string) => (val: string) => setV((s) => ({ ...s, [k]: val }));
  const role = v["role"] as Role;
  const age = ageFrom(v["dateOfBirth"]);

  const text = (k: string, label: string, props: { type?: string; placeholder?: string; required?: boolean } = {}) => (
    <div key={k}>
      <Label htmlFor={k}>{label}{props.required && <span className="text-destructive"> *</span>}</Label>
      <Input id={k} type={props.type ?? "text"} placeholder={props.placeholder} className="mt-1.5" value={v[k] ?? ""} onChange={(e) => set(k)(e.target.value)} aria-invalid={!!errs[k]} />
      <FieldError msg={errs[k]} />
    </div>
  );

  async function pickPhoto(file: File | undefined) {
    if (!file) { setPhoto(null); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setErrs((e) => ({ ...e, photo: "Use a JPG, PNG or WebP image" })); return; }
    if (file.size > 2 * 1024 * 1024) { setErrs((e) => ({ ...e, photo: "Photo must be under 2 MB" })); return; }
    const data = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });
    setErrs(({ photo: _p, ...rest }) => rest);
    setPhoto({ data, type: file.type });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrs({}); setFormError(null);
    if (mode !== "edit" && v["password"] !== v["password2"]) { setErrs({ password2: "Passwords don't match" }); return; }
    const payload: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) if (k !== "password2" && val !== "") payload[k] = val;
    if (photo) payload["photo"] = photo;
    setBusy(true);
    try {
      const res = await onSubmit(payload);
      if (!res.ok) { setFormError(res.error); setErrs(res.fieldErrors ?? {}); }
    } catch (err) {
      setFormError(err instanceof Error && /Forbidden/.test(err.message) ? "You don't have permission to do this." : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert msg={formError} />
      {extra}
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
          {lockRole ? <Input id="role" disabled value={ROLE_LABEL[lockRole]} className="mt-1.5" /> : (
            <select id="role" value={role} onChange={(e) => set("role")(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          )}
        </div>
        <div>
          <Label htmlFor="status">Account status</Label>
          {mode === "setup" ? <Input id="status" disabled value="Active" className="mt-1.5" /> : <Select id="status" value={v["status"] ?? "active"} onChange={set("status")} options={STATUSES} />}
        </div>
        {text("fullName", "Full name", { required: true })}
        {text("username", "Username", { required: true, placeholder: "lowercase, e.g. meera.iyer" })}
        {text("phone", "Mobile number", { required: true, placeholder: "10-digit, e.g. 98220 11223" })}
        {text("email", "Email address", { type: "email", placeholder: "Optional — needed for email password reset" })}
        <div>
          <Label htmlFor="dateOfBirth">Date of birth{role === "student" && <span className="text-destructive"> *</span>}</Label>
          <Input id="dateOfBirth" type="date" className="mt-1.5" value={v["dateOfBirth"] ?? ""} onChange={(e) => set("dateOfBirth")(e.target.value)} />
          {age !== null && <p className="mt-1 text-xs text-muted-foreground">Age: {age}</p>}
          <FieldError msg={errs["dateOfBirth"]} />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" value={v["gender"] ?? ""} onChange={set("gender")} options={GENDERS} placeholder="Not specified" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="photo">Profile photo</Label>
          <Input id="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1.5" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
          <FieldError msg={errs["photo"]} />
        </div>
      </section>

      <section className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <h3 className="text-sm font-semibold sm:col-span-2">{ROLE_LABEL[role]} details</h3>
        {role === "student" && <>
          {text("rollNumber", "Student / roll number", { required: true })}
          {text("institutionName", "Institution", { required: true })}
          {text("course", "Course", { required: true })}
          {text("department", "Department", { required: true })}
          {text("yearSemester", "Current year / semester", { required: true, placeholder: "e.g. Year 2 · Sem 3" })}
        </>}
        {role === "faculty" && <>
          {text("employeeId", "Employee ID", { required: true })}
          {text("institutionName", "Institution", { required: true })}
          {text("department", "Department", { required: true })}
          {text("designation", "Designation", { required: true })}
          {text("joiningDate", "Joining date", { type: "date", required: true })}
        </>}
        {role === "institution" && <>
          {text("institutionName", "Institution name", { required: true })}
          {text("institutionCode", "Official institution identifier", { required: true, placeholder: "e.g. AICTE permanent ID" })}
          {text("designation", "Designation", { required: true })}
          <div>
            <Label htmlFor="authorizationStatus">Authorization status <span className="text-destructive">*</span></Label>
            <Select id="authorizationStatus" value={v["authorizationStatus"] ?? ""} onChange={set("authorizationStatus")} options={AUTH_STATUSES} placeholder="Select…" />
            <FieldError msg={errs["authorizationStatus"]} />
          </div>
        </>}
        {role === "admin" && <>
          {text("designation", "Designation", { required: true })}
          <div>
            <Label htmlFor="permissionLevel">Permission level <span className="text-destructive">*</span></Label>
            <Select id="permissionLevel" value={v["permissionLevel"] ?? ""} onChange={set("permissionLevel")} options={PERMISSION_LEVELS} placeholder="Select…" />
            <FieldError msg={errs["permissionLevel"]} />
          </div>
        </>}
      </section>

      {mode !== "edit" && (
        <section className="grid gap-4 border-t pt-5 sm:grid-cols-2">
          <div><Label htmlFor="password">Initial password <span className="text-destructive">*</span></Label><div className="mt-1.5"><PasswordInput id="password" autoComplete="new-password" value={v["password"] ?? ""} onChange={(e) => set("password")(e.target.value)} /></div><FieldError msg={errs["password"]} /></div>
          <div><Label htmlFor="password2">Confirm password <span className="text-destructive">*</span></Label><div className="mt-1.5"><PasswordInput id="password2" autoComplete="new-password" value={v["password2"] ?? ""} onChange={(e) => set("password2")(e.target.value)} /></div><FieldError msg={errs["password2"]} /></div>
          <p className="text-xs text-muted-foreground sm:col-span-2">At least 8 characters with a letter and a number. Passwords are stored securely and never shown again.</p>
        </section>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} {submitLabel}</Button>
      </div>
    </form>
  );
}
