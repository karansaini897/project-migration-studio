import type { Role } from "@/data/types";

export interface DemoCredential { role: Role; username: string; password: string }

/** Simulated, frontend-only demo accounts. Not real credentials. */
export const DEMO_CREDENTIALS: DemoCredential[] = [
  { role: "admin", username: "admin", password: "Admin123" },
  { role: "institution", username: "institution", password: "Inst123" },
  { role: "faculty", username: "faculty", password: "Faculty123" },
  { role: "student", username: "student", password: "Student123" },
];

/** Username is case-insensitive and trimmed; password must match exactly. */
export function checkDemoCredentials(username: string, password: string): Role | null {
  const u = username.trim().toLowerCase();
  return DEMO_CREDENTIALS.find((c) => c.username === u && c.password === password)?.role ?? null;
}
