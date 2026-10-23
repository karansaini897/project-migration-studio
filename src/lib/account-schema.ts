import { z } from "zod";
import { normalizePhone, normalizeUsername } from "./validation";
import type { Role } from "@/data/types";

export const ROLES = ["admin", "institution", "faculty", "student"] as const satisfies readonly Role[];
export const STATUSES = ["active", "suspended", "pending"] as const;
export const GENDERS = ["female", "male", "non_binary", "prefer_not_to_say"] as const;
export const AUTH_STATUSES = ["pending", "authorized", "revoked"] as const;
export const PERMISSION_LEVELS = ["reviewer", "senior_reviewer", "super_admin"] as const;

/** Whole years between a date of birth (YYYY-MM-DD) and `today`. */
export function ageFrom(dob: string | null | undefined, today = new Date()): number | null {
  if (!dob) return null;
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = today.getFullYear() - y;
  const mo = today.getMonth() + 1;
  if (mo < m || (mo === m && today.getDate() < d)) age--;
  return age;
}

const opt = (max = 120) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const accountBase = z.object({
  fullName: z.string().trim().min(2, "Enter the full name").max(120),
  username: z
    .string()
    .transform(normalizeUsername)
    .pipe(z.string().regex(/^[a-z0-9._]{3,30}$/, "3–30 characters: letters, numbers, dot or underscore")),
  phone: z.string().transform((v, ctx) => {
    const p = normalizePhone(v);
    if (!p) { ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit Indian mobile number" }); return z.NEVER; }
    return p;
  }),
  email: z.string().trim().max(255).email("Enter a valid email").optional().or(z.literal("")).transform((v) => (v ? v.toLowerCase() : undefined)),
  dateOfBirth: isoDate.optional().or(z.literal("")).transform((v) => v || undefined)
    .refine((v) => { if (!v) return true; const a = ageFrom(v); return a !== null && a >= 10 && a <= 100; }, "Date of birth looks out of range"),
  gender: z.enum(GENDERS).optional(),
  photo: z.object({ data: z.string().max(2_800_000), type: z.enum(["image/jpeg", "image/png", "image/webp"]) }).optional(),
  removePhoto: z.boolean().optional(),
  status: z.enum(STATUSES).default("active"),
  role: z.enum(ROLES),
  rollNumber: opt(40), institutionName: opt(160), institutionCode: opt(40), course: opt(120),
  department: opt(120), yearSemester: opt(40), employeeId: opt(40), designation: opt(120),
  joiningDate: isoDate.optional().or(z.literal("")).transform((v) => v || undefined),
  authorizationStatus: z.enum(AUTH_STATUSES).optional(),
  permissionLevel: z.enum(PERMISSION_LEVELS).optional(),
});

type Base = z.infer<typeof accountBase>;

/** Role-specific required fields. */
export function roleIssues(v: Partial<Base>): { path: keyof Base; message: string }[] {
  const need = (k: keyof Base, label: string) => (v[k] ? [] : [{ path: k, message: `${label} is required` }]);
  switch (v.role) {
    case "student":
      return [...need("rollNumber", "Roll number"), ...need("institutionName", "Institution"), ...need("course", "Course"), ...need("department", "Department"), ...need("yearSemester", "Year / semester"), ...need("dateOfBirth", "Date of birth")];
    case "faculty":
      return [...need("employeeId", "Employee ID"), ...need("institutionName", "Institution"), ...need("department", "Department"), ...need("designation", "Designation"), ...need("joiningDate", "Joining date")];
    case "institution":
      return [...need("institutionName", "Institution name"), ...need("institutionCode", "Institution identifier"), ...need("designation", "Designation"), ...need("authorizationStatus", "Authorization status")];
    case "admin":
      return [...need("designation", "Designation"), ...need("permissionLevel", "Permission level")];
    default:
      return [];
  }
}

const withRoleRules = <T extends z.ZodTypeAny>(s: T) =>
  s.superRefine((v: Partial<Base>, ctx) => roleIssues(v).forEach((i) => ctx.addIssue({ code: "custom", path: [i.path], message: i.message })));

export const createAccountSchema = withRoleRules(accountBase.extend({ password: passwordSchema }));
export const updateAccountSchema = withRoleRules(accountBase.extend({ id: z.string().uuid() }));
export const setupAdminSchema = withRoleRules(accountBase.extend({ password: passwordSchema, setupCode: z.string().min(8).max(200), role: z.literal("admin") }));

export type CreateAccountInput = z.input<typeof createAccountSchema>;

export interface AccountRow {
  id: string; role: Role; fullName: string; username: string; phone: string; email: string | null;
  dateOfBirth: string | null; age: number | null; gender: string | null; photoUrl: string | null; status: string;
  rollNumber: string | null; institutionName: string | null; institutionCode: string | null; course: string | null;
  department: string | null; yearSemester: string | null; employeeId: string | null; designation: string | null;
  joiningDate: string | null; authorizationStatus: string | null; permissionLevel: string | null; createdAt: string;
}

/** Map a DB unique-violation into a user-facing field error. */
export function conflictMessage(err: { code?: string | undefined; message?: string | undefined; details?: string | undefined } | null): { field: string; message: string } | null {
  if (!err) return null;
  const txt = `${err.message ?? ""} ${err.details ?? ""}`;
  if (err.code === "23505" || /duplicate|already/i.test(txt)) {
    if (/username/.test(txt)) return { field: "username", message: "This username is already registered" };
    if (/phone/.test(txt)) return { field: "phone", message: "This phone number is already registered" };
    if (/email/i.test(txt)) return { field: "email", message: "This email is already registered" };
  }
  return null;
}
