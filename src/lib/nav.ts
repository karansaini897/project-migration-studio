import {
  LayoutDashboard, Building2, FileStack, FolderOpen, ShieldCheck, CalendarClock, BarChart3, UserRound, Settings, Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/data/types";

export type NavPath =
  | "/admin" | "/institution" | "/faculty" | "/student" | "/applications" | "/documents" | "/verification"
  | "/calendar" | "/reports" | "/profile" | "/settings" | "/accounts";

export interface NavItem { to: NavPath; label: string; icon: LucideIcon; roles: Role[]; group: "main" | "account" }

const all: Role[] = ["admin", "institution", "faculty", "student"];

export const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["admin"], group: "main" },
  { to: "/institution", label: "Overview", icon: Building2, roles: ["institution"], group: "main" },
  { to: "/faculty", label: "Overview", icon: LayoutDashboard, roles: ["faculty"], group: "main" },
  { to: "/student", label: "Overview", icon: LayoutDashboard, roles: ["student"], group: "main" },
  { to: "/applications", label: "Applications", icon: FileStack, roles: ["admin", "institution"], group: "main" },
  { to: "/documents", label: "Documents", icon: FolderOpen, roles: ["admin", "institution", "faculty", "student"], group: "main" },
  { to: "/verification", label: "Verification", icon: ShieldCheck, roles: ["admin"], group: "main" },
  { to: "/calendar", label: "Expiry calendar", icon: CalendarClock, roles: ["admin", "institution", "faculty"], group: "main" },
  { to: "/reports", label: "Reports & activity", icon: BarChart3, roles: ["admin", "institution"], group: "main" },
  { to: "/accounts", label: "Accounts", icon: Users, roles: ["admin"], group: "main" },
  { to: "/profile", label: "Profile", icon: UserRound, roles: all, group: "account" },
  { to: "/settings", label: "Settings", icon: Settings, roles: all, group: "account" },
];

export const homeFor = (r: Role): NavPath =>
  r === "admin" ? "/admin" : r === "institution" ? "/institution" : r === "faculty" ? "/faculty" : "/student";

export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} · AICTE Validation Portal (Demo)` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · AICTE Validation Portal (Demo)` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
