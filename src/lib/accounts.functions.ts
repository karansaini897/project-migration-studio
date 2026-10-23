import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  conflictMessage, createAccountSchema, passwordSchema, setupAdminSchema, updateAccountSchema, type AccountRow,
} from "./account-schema";
import { normalizePhone, normalizeUsername } from "./validation";
import type { Role } from "@/data/types";

export type FieldErrors = Record<string, string>;
export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: FieldErrors | undefined };

const GENERIC_LOGIN_ERROR = "Incorrect username/phone or password.";

function zodErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const i of err.issues) { const k = String(i.path[0] ?? "form"); if (!out[k]) out[k] = i.message; }
  return out;
}

type AuthCtx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };

/** Verifies the caller is an active admin using the trusted server-side role table. */
async function assertAdmin(ctx: AuthCtx) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden: admin access required");
  const { data: me } = await ctx.supabase.from("profiles").select("status").eq("id", ctx.userId).maybeSingle();
  if (me?.status !== "active") throw new Error("Forbidden: account is not active");
}

async function lookupByIdentifier(identifier: string) {
  const { getAdmin } = await import("./accounts.server");
  const admin = await getAdmin();
  const phone = normalizePhone(identifier);
  const q = admin.from("profiles").select("id, status, contact_email");
  const { data } = phone ? await q.eq("phone", phone).maybeSingle() : await q.eq("username", normalizeUsername(identifier)).maybeSingle();
  return data;
}

// ---------- Public: sign in / password reset / first admin setup ----------

export const signInWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((i: { identifier: string; password: string }) =>
    z.object({ identifier: z.string().trim().min(1).max(64), password: z.string().min(1).max(200) }).parse(i))
  .handler(async ({ data }): Promise<Result<{ accessToken: string; refreshToken: string }>> => {
    const profile = await lookupByIdentifier(data.identifier);
    if (!profile) return { ok: false, error: GENERIC_LOGIN_ERROR };
    const { getAdmin, publicClient } = await import("./accounts.server");
    const admin = await getAdmin();
    const { data: au } = await admin.auth.admin.getUserById(profile.id);
    if (!au?.user?.email) return { ok: false, error: GENERIC_LOGIN_ERROR };
    const pc = publicClient();
    const { data: s, error } = await pc.auth.signInWithPassword({ email: au.user.email, password: data.password });
    if (error || !s.session) return { ok: false, error: GENERIC_LOGIN_ERROR };
    if (profile.status !== "active") {
      await pc.auth.signOut();
      return { ok: false, error: profile.status === "suspended" ? "This account is suspended. Contact your administrator." : "This account is pending activation. Contact your administrator." };
    }
    return { ok: true, accessToken: s.session.access_token, refreshToken: s.session.refresh_token };
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((i: { identifier: string; redirectTo: string }) =>
    z.object({ identifier: z.string().trim().min(1).max(64), redirectTo: z.string().url().max(300) }).parse(i))
  .handler(async ({ data }) => {
    const profile = await lookupByIdentifier(data.identifier);
    if (profile?.contact_email) {
      const { getAdmin, publicClient } = await import("./accounts.server");
      const { data: au } = await (await getAdmin()).auth.admin.getUserById(profile.id);
      // Only real, registered emails receive reset links; synthetic addresses can't.
      if (au?.user?.email && au.user.email.toLowerCase() === profile.contact_email.toLowerCase()) {
        await publicClient().auth.resetPasswordForEmail(au.user.email, { redirectTo: data.redirectTo });
      }
    }
    // Always the same response so accounts can't be discovered.
    return { ok: true as const };
  });

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdmin } = await import("./accounts.server");
  const { data } = await (await getAdmin()).from("app_setup").select("id").eq("id", 1).maybeSingle();
  return { needsSetup: !data, configured: !!process.env["ADMIN_SETUP_CODE"] };
});

export const setupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => i as Record<string, unknown>)
  .handler(async ({ data }): Promise<Result> => {
    const parsed = setupAdminSchema.safeParse({ ...data, role: "admin" });
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
    const expected = process.env["ADMIN_SETUP_CODE"];
    if (!expected) return { ok: false, error: "First-admin setup isn't configured yet." };
    if (parsed.data.setupCode !== expected) return { ok: false, error: "That setup code is not correct.", fieldErrors: { setupCode: "Incorrect setup code" } };
    const { getAdmin } = await import("./accounts.server");
    const admin = await getAdmin();
    // Atomic one-time lock: only the first insert of row id=1 succeeds.
    const { error: lockErr } = await admin.from("app_setup").insert({ id: 1 });
    if (lockErr) return { ok: false, error: "Setup has already been completed. Ask an existing admin for an account." };
    const res = await createAccountInternal(parsed.data, null);
    if (!res.ok) await admin.from("app_setup").delete().eq("id", 1);
    return res;
  });

// ---------- Authenticated: own account ----------

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountRow | null> => {
    const [{ data: p }, { data: r }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId).maybeSingle(),
    ]);
    if (!p || !r || p.status !== "active") return null;
    const { toRow } = await import("./accounts.server");
    return toRow(p, r.role as Role);
  });

// ---------- Admin: account management ----------

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountRow[]> => {
    await assertAdmin(context);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      context.supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleOf = new Map((rs ?? []).map((r) => [r.user_id, r.role as Role]));
    const { toRow } = await import("./accounts.server");
    return Promise.all((ps ?? []).filter((p) => roleOf.has(p.id)).map((p) => toRow(p, roleOf.get(p.id)!)));
  });

export const checkAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { username?: string; phone?: string; excludeId?: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { findTaken } = await import("./accounts.server");
    const u = data.username ? normalizeUsername(data.username) : "";
    const p = data.phone ? normalizePhone(data.phone) ?? "" : "";
    const t = await findTaken(u || "\u0000", p || "\u0000", data.excludeId);
    return { usernameTaken: !!u && t.usernameTaken, phoneTaken: !!p && t.phoneTaken };
  });

async function createAccountInternal(v: z.infer<typeof createAccountSchema>, createdBy: string | null): Promise<Result<{ id: string }>> {
  const { getAdmin, findTaken, profileColumns, syntheticEmail, uploadPhoto } = await import("./accounts.server");
  const admin = await getAdmin();
  const taken = await findTaken(v.username, v.phone);
  const fe: FieldErrors = {};
  if (taken.usernameTaken) fe["username"] = "This username is already registered";
  if (taken.phoneTaken) fe["phone"] = "This phone number is already registered";
  if (Object.keys(fe).length) return { ok: false, error: "Username or phone number already in use.", fieldErrors: fe };

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email: v.email ?? syntheticEmail(), password: v.password, email_confirm: true,
  });
  if (cErr || !created.user) {
    const c = conflictMessage({ message: cErr?.message ?? "", code: cErr?.code });
    if (c) return { ok: false, error: c.message, fieldErrors: { [c.field]: c.message } };
    if (cErr?.code === "weak_password") {
      const m = "This password appears in known data leaks. Choose a different one.";
      return { ok: false, error: m, fieldErrors: { password: m } };
    }
    return { ok: false, error: "Could not create the account." };
  }
  const id = created.user.id;
  // DB unique indexes are the final guard against simultaneous duplicate registrations.
  const { error: pErr } = await admin.from("profiles").insert({ id, ...profileColumns(v), created_by: createdBy });
  if (pErr) {
    await admin.auth.admin.deleteUser(id);
    const c = conflictMessage(pErr);
    return c ? { ok: false, error: c.message, fieldErrors: { [c.field]: c.message } } : { ok: false, error: "Could not save the profile." };
  }
  const { error: rErr } = await admin.from("user_roles").insert({ user_id: id, role: v.role });
  if (rErr) { await admin.auth.admin.deleteUser(id); return { ok: false, error: "Could not assign the role." }; }
  if (v.photo) {
    try { const path = await uploadPhoto(id, v.photo); await admin.from("profiles").update({ photo_url: path }).eq("id", id); }
    catch { /* account stays valid without a photo */ }
  }
  return { ok: true, id };
}

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Record<string, unknown>)
  .handler(async ({ data, context }): Promise<Result<{ id: string }>> => {
    await assertAdmin(context);
    const parsed = createAccountSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
    return createAccountInternal(parsed.data, context.userId);
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Record<string, unknown>)
  .handler(async ({ data, context }): Promise<Result> => {
    await assertAdmin(context);
    const parsed = updateAccountSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
    const v = parsed.data;
    if (v.id === context.userId && (v.role !== "admin" || v.status !== "active"))
      return { ok: false, error: "You can't remove your own admin access or deactivate yourself." };
    const { getAdmin, findTaken, profileColumns, syntheticEmail, uploadPhoto } = await import("./accounts.server");
    const admin = await getAdmin();
    const taken = await findTaken(v.username, v.phone, v.id);
    const fe: FieldErrors = {};
    if (taken.usernameTaken) fe["username"] = "This username is already registered";
    if (taken.phoneTaken) fe["phone"] = "This phone number is already registered";
    if (Object.keys(fe).length) return { ok: false, error: "Username or phone number already in use.", fieldErrors: fe };

    const { data: au } = await admin.auth.admin.getUserById(v.id);
    if (!au?.user) return { ok: false, error: "Account not found." };
    const wantEmail = v.email ?? (au.user.email?.endsWith("@accounts.aicte-portal.example") ? au.user.email : syntheticEmail());
    if (wantEmail !== au.user.email) {
      const { error } = await admin.auth.admin.updateUserById(v.id, { email: wantEmail, email_confirm: true });
      if (error) { const c = conflictMessage({ message: error.message }); return { ok: false, error: c?.message ?? "Could not update the email.", fieldErrors: c ? { [c.field]: c.message } : undefined }; }
    }
    const cols: Record<string, unknown> = profileColumns(v);
    if (v.removePhoto) cols["photo_url"] = null;
    if (v.photo) { try { cols["photo_url"] = await uploadPhoto(v.id, v.photo); } catch { return { ok: false, error: "Could not upload the photo." }; } }
    const { error: pErr } = await admin.from("profiles").update(cols as never).eq("id", v.id);
    if (pErr) { const c = conflictMessage(pErr); return { ok: false, error: c?.message ?? "Could not save changes.", fieldErrors: c ? { [c.field]: c.message } : undefined }; }
    const { error: rErr } = await admin.from("user_roles").update({ role: v.role }).eq("user_id", v.id);
    if (rErr) return { ok: false, error: "Could not update the role." };
    return { ok: true };
  });

export const setAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; password: string }) => z.object({ id: z.string().uuid(), password: z.string().max(200) }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    await assertAdmin(context);
    const pw = passwordSchema.safeParse(data.password);
    if (!pw.success) return { ok: false, error: (pw.error.issues[0]?.message ?? "Invalid password"), fieldErrors: { password: (pw.error.issues[0]?.message ?? "Invalid password") } };
    const { getAdmin } = await import("./accounts.server");
    const { error } = await (await getAdmin()).auth.admin.updateUserById(data.id, { password: pw.data });
    if (error?.code === "weak_password") return { ok: false, error: "This password appears in known data leaks. Choose a different one." };
    return error ? { ok: false, error: "Could not set the password." } : { ok: true };
  });
