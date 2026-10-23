// Session + demo store. Real accounts come from Lovable Cloud auth (role read server-side);
// demo personas and portal records stay client-only in localStorage and are clearly labelled.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, signInWithIdentifier } from "@/lib/accounts.functions";
import type { AccountRow } from "@/lib/account-schema";
import { createSeedData } from "@/data/mock-data";
import type { AppStatus, DemoData, Role, User } from "@/data/types";

const DATA_KEY = "aicte-demo-data-v2";
const SESSION_KEY = "aicte-demo-session-v1";
export const THEME_KEY = "aicte-demo-theme";

type Theme = "light" | "dark";

interface Store {
  hydrated: boolean;
  data: DemoData;
  user: User | null;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** True when the signed-in identity is a demo persona, not a real account. */
  isDemo: boolean;
  account: AccountRow | null;
  login: (userId: string) => void;
  signInAccount: (identifier: string, password: string) => Promise<{ ok: true; role: Role } | { ok: false; error: string }>;
  refreshAccount: () => Promise<void>;
  logout: () => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  setAppStatus: (appId: string, status: AppStatus) => void;
  markRead: (id?: string) => void;
  toggleRead: (id: string) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<DemoData>(() => createSeedData());
  const [userId, setUserId] = useState<string | null>(null);
  const [theme, setThemeState] = useState<Theme>("light");
  const [localReady, setLocalReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<AccountRow | null>(null);
  const loadSeq = useRef(0);
  const actorRef = useRef<{ name: string; role: Role } | null>(null);

  const loadAccount = useCallback(async (): Promise<AccountRow | null> => {
    const seq = ++loadSeq.current;
    const { data } = await supabase.auth.getSession();
    let acc: AccountRow | null = null;
    if (data.session) {
      try { acc = await getMyAccount(); } catch { acc = null; }
      // Signed in to auth but no active portal account (or suspended): drop the session.
      if (!acc) await supabase.auth.signOut();
    }
    if (seq === loadSeq.current) setAccount(acc);
    return acc;
  }, []);

  useEffect(() => {
    loadAccount().finally(() => setAuthReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { loadSeq.current++; setAccount(null); }
      else if (event === "USER_UPDATED") void loadAccount();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadAccount]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) setData(JSON.parse(raw));
      setUserId(localStorage.getItem(SESSION_KEY));
      setThemeState(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
    } catch { /* ignore corrupt storage */ }
    setLocalReady(true);
  }, []);

  useEffect(() => { if (localReady && authReady) setHydrated(true); }, [localReady, authReady]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const login = useCallback((id: string) => {
    if (account) { void supabase.auth.signOut(); setAccount(null); }
    localStorage.setItem(SESSION_KEY, id); setUserId(id);
  }, [account]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY); setUserId(null);
    if (account) { loadSeq.current++; setAccount(null); void supabase.auth.signOut(); }
  }, [account]);

  const signInAccount = useCallback(async (identifier: string, password: string) => {
    try {
      const res = await signInWithIdentifier({ data: { identifier, password } });
      if (!res.ok) return { ok: false as const, error: res.error };
      const { error } = await supabase.auth.setSession({ access_token: res.accessToken, refresh_token: res.refreshToken });
      if (error) return { ok: false as const, error: "Could not start your session. Please try again." };
      const acc = await loadAccount();
      if (!acc) return { ok: false as const, error: "This account doesn't have portal access." };
      localStorage.removeItem(SESSION_KEY); setUserId(null);
      return { ok: true as const, role: acc.role };
    } catch {
      return { ok: false as const, error: "Something went wrong. Check your connection and try again." };
    }
  }, [loadAccount]);

  const refreshAccount = useCallback(async () => { await loadAccount(); }, [loadAccount]);

  const updateUser = useCallback((id: string, patch: Partial<User>) =>
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })), []);

  const setAppStatus = useCallback((appId: string, status: AppStatus) =>
    setData((d) => {
      const app = d.applications.find((a) => a.id === appId);
      if (!app) return d;
      const now = new Date().toISOString();
      const actor = actorRef.current;
      const kind = status === "Query Raised" ? "correction" : status === "Under Review" ? "review" : "status";
      return {
        ...d,
        applications: d.applications.map((a) => (a.id === appId ? { ...a, status, updatedOn: now } : a)),
        activity: [{
          id: `act-${Date.now()}`, at: now, actor: actor?.name ?? "You", actorRole: actor?.role ?? "admin",
          action: `marked ${status.toLowerCase()}`, target: app.ref, institutionId: app.institutionId, detail: `Status: ${app.status} → ${status}`,
        }, ...d.activity],
        notifications: [{
          id: `n-${Date.now()}`, at: now, kind, read: false, roles: ["admin", "institution"], institutionId: app.institutionId, appId,
          title: kind === "correction" ? `Correction requested on ${app.ref}` : `${app.ref} ${status.toLowerCase()}`,
          body: `${actor?.name ?? "A reviewer"} changed the status from ${app.status} to ${status} (demo action).`,
        }, ...d.notifications],
      };
    }), []);

  const markRead = useCallback((id?: string) =>
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (!id || n.id === id ? { ...n, read: true } : n)) })), []);

  const toggleRead = useCallback((id: string) =>
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n)) })), []);

  const resetDemo = useCallback(() => setData(createSeedData()), []);

  const demoUser = useMemo(() => data.users.find((u) => u.id === userId) ?? null, [data.users, userId]);
  const user: User | null = useMemo(() => {
    if (account) {
      return {
        id: account.id, name: account.fullName, username: account.username, email: account.email ?? "",
        phone: account.phone, role: account.role, ...(account.photoUrl ? { photo: account.photoUrl } : {}),
        title: [account.designation ?? account.course, account.institutionName].filter(Boolean).join(" · ") || ROLE_LABEL[account.role],
      };
    }
    return demoUser;
  }, [account, demoUser]);
  const isDemo = !account && !!demoUser;
  actorRef.current = user ? { name: user.name, role: user.role } : null;

  return (
    <Ctx.Provider value={{ hydrated, data, user, isDemo, account, theme, setTheme, login, signInAccount, refreshAccount, logout, updateUser, setAppStatus, markRead, toggleRead, resetDemo }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo must be used inside DemoStoreProvider");
  return c;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  institution: "Institutional Representative",
  faculty: "Faculty / Staff",
  student: "Student",
};
