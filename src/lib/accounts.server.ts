// Server-only helpers for account management. Import only inside server function handlers.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ageFrom, type AccountRow } from "./account-schema";
import type { Role } from "@/data/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Fresh, non-persistent publishable client for password grants on the server. */
export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const syntheticEmail = () => `acct-${crypto.randomUUID()}@accounts.aicte-portal.example`;

export async function signedPhoto(path: string | null): Promise<string | null> {
  if (!path) return null;
  const admin = await getAdmin();
  const { data } = await admin.storage.from("profile-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function uploadPhoto(userId: string, photo: { data: string; type: string }): Promise<string> {
  const admin = await getAdmin();
  const b64 = photo.data.includes(",") ? (photo.data.split(",")[1] ?? "") : photo.data;
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (bytes.byteLength > 2 * 1024 * 1024) throw new Error("Photo must be under 2 MB");
  const ext = photo.type.split("/")[1];
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await admin.storage.from("profile-photos").upload(path, bytes, { contentType: photo.type, upsert: true });
  if (error) throw new Error("Could not upload the photo");
  return path;
}

export async function toRow(p: Profile, role: Role): Promise<AccountRow> {
  return {
    id: p.id, role, fullName: p.full_name, username: p.username, phone: p.phone, email: p.contact_email,
    dateOfBirth: p.date_of_birth, age: ageFrom(p.date_of_birth), gender: p.gender, photoUrl: await signedPhoto(p.photo_url),
    status: p.status, rollNumber: p.roll_number, institutionName: p.institution_name, institutionCode: p.institution_code,
    course: p.course, department: p.department, yearSemester: p.year_semester, employeeId: p.employee_id,
    designation: p.designation, joiningDate: p.joining_date, authorizationStatus: p.authorization_status,
    permissionLevel: p.permission_level, createdAt: p.created_at,
  };
}

interface FieldInput {
  fullName: string; username: string; phone: string; email?: string; dateOfBirth?: string; gender?: string;
  status: Database["public"]["Enums"]["account_status"]; role: Role;
  rollNumber?: string; institutionName?: string; institutionCode?: string; course?: string; department?: string;
  yearSemester?: string; employeeId?: string; designation?: string; joiningDate?: string;
  authorizationStatus?: string; permissionLevel?: string;
}

/** Map validated input to profile columns, clearing fields that don't belong to the role. */
export function profileColumns(v: FieldInput) {
  const r = v.role;
  const keep = <T,>(roles: Role[], val: T | undefined) => (roles.includes(r) ? val ?? null : null);
  return {
    full_name: v.fullName, username: v.username, phone: v.phone, contact_email: v.email ?? null,
    date_of_birth: v.dateOfBirth ?? null, gender: v.gender ?? null, status: v.status,
    roll_number: keep(["student"], v.rollNumber),
    institution_name: keep(["student", "faculty", "institution"], v.institutionName),
    institution_code: keep(["institution"], v.institutionCode),
    course: keep(["student"], v.course),
    department: keep(["student", "faculty"], v.department),
    year_semester: keep(["student"], v.yearSemester),
    employee_id: keep(["faculty"], v.employeeId),
    designation: keep(["faculty", "institution", "admin"], v.designation),
    joining_date: keep(["faculty"], v.joiningDate),
    authorization_status: keep(["institution"], v.authorizationStatus),
    permission_level: keep(["admin"], v.permissionLevel),
  };
}

export async function findTaken(username: string, phone: string, excludeId?: string) {
  const admin = await getAdmin();
  const [u, p] = await Promise.all([
    admin.from("profiles").select("id").eq("username", username).maybeSingle(),
    admin.from("profiles").select("id").eq("phone", phone).maybeSingle(),
  ]);
  return {
    usernameTaken: !!u.data && u.data.id !== excludeId,
    phoneTaken: !!p.data && p.data.id !== excludeId,
  };
}
