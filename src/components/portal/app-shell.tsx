import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Menu, Moon, Search, Sun, LogOut, ShieldAlert, X, Repeat } from "lucide-react";
import { DEMO_PERSONA_IDS } from "@/data/mock-data";
import type { Role } from "@/data/types";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, useDemo } from "@/lib/demo-store";
import { NAV, homeFor } from "@/lib/nav";
import { initials } from "./ui-bits";
import { relTime } from "@/data/selectors";

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useDemo();
  const path = useLocation({ select: (l) => l.pathname });
  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const group = (g: "main" | "account") =>
    items.filter((i) => i.group === g).map((i) => {
      const active = path === i.to;
      return (
        <Link
          key={i.to}
          to={i.to}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60",
          )}
        >
          <i.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
          {i.label}
        </Link>
      );
    });
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <Link to={homeFor(user.role)} className="flex items-center gap-2.5 px-3" onClick={onNavigate}>
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">A</span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Validation Portal</span>
          <span className="block text-[11px] text-muted-foreground">AICTE prototype · demo</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
        {group("main")}
      </nav>
      <nav className="flex flex-col gap-0.5">
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Account</p>
        {group("account")}
      </nav>
      <div className="mt-auto rounded-lg border border-dashed p-3 text-[11px] leading-relaxed text-muted-foreground">
        Prototype. Portal records are sample data stored only in this browser.
      </div>
    </div>
  );
}

function Notifications() {
  const { data, user, markRead } = useDemo();
  if (!user) return null;
  const list = data.notifications.filter((n) => n.roles.includes(user.role));
  const unread = list.filter((n) => !n.read).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{unread}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold">Notifications</span>
          <button className="text-xs text-primary hover:underline" onClick={() => markRead()}>Mark all read</button>
        </div>
        <div className="max-h-96 overflow-auto">
          {list.map((n) => (
            <button key={n.id} onClick={() => markRead(n.id)} className="flex w-full gap-3 border-b px-3 py-3 text-left last:border-0 hover:bg-muted">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{n.title}</span>
                <span className="block text-xs text-muted-foreground">{n.body}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{relTime(n.at)}</span>
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, user, isDemo, theme, setTheme, logout, login, data } = useDemo();
  const navigate = useNavigate();
  const path = useLocation({ select: (l) => l.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/", replace: true });
  }, [hydrated, user, navigate]);

  if (!hydrated || !user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading demo workspace…</div>;
  }

  const allowed = NAV.find((n) => n.to === path)?.roles.includes(user.role) ?? true;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:block">
        <Sidebar />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-sidebar shadow-pop animate-in slide-in-from-left duration-200">
            <button className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="size-4" /></button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {isDemo ? (
          <div className="border-b border-warning/30 bg-warning-soft px-4 py-1.5 text-center text-xs text-warning">
            Demo mode — simulated persona <strong>{ROLE_LABEL[user.role]}</strong>. Not a real account; all records are fictional.
          </div>
        ) : (
          <div className="border-b border-info/30 bg-info-soft px-4 py-1.5 text-center text-xs text-info">
            Signed in as <strong>{user.name}</strong> ({ROLE_LABEL[user.role]}). Portal records shown are still sample data.
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="size-4" /></Button>
          <form
            className="relative hidden max-w-md flex-1 sm:block"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: user.role === "admin" || user.role === "institution" ? "/applications" : "/documents", search: { q: q || undefined } }); }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search applications, institutions, documents…"
              className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Notifications />
            <Button variant="ghost" size="sm" className="hidden gap-1.5 sm:inline-flex" onClick={() => { logout(); navigate({ to: "/", replace: true }); }}>
              <LogOut className="size-4" /> Logout
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-8">
                  {user.photo && <AvatarImage src={user.photo} alt={user.name} />}
                  <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials(user.name)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <span className="block text-sm">{user.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{ROLE_LABEL[user.role]}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
                {isDemo && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Switch demo persona</DropdownMenuLabel>
                    {(Object.keys(DEMO_PERSONA_IDS) as Role[]).filter((r) => DEMO_PERSONA_IDS[r] !== user.id).map((r) => (
                      <DropdownMenuItem key={r} onClick={() => { login(DEMO_PERSONA_IDS[r]); navigate({ to: homeFor(r) }); }}>
                        <Repeat className="size-4" /> {ROLE_LABEL[r]}
                        <span className="ml-auto truncate text-xs text-muted-foreground">{data.users.find((u) => u.id === DEMO_PERSONA_IDS[r])?.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/", replace: true }); }}>
                  <LogOut className="size-4" /> {isDemo ? "Exit demo" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          {allowed ? children : (
            <div className="panel mx-auto mt-10 max-w-md p-8 text-center">
              <ShieldAlert className="mx-auto size-8 text-warning" />
              <h1 className="mt-3 text-lg font-semibold">Not available for this role</h1>
              <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABEL[user.role]} accounts can’t open this section.</p>
              <Button asChild className="mt-5"><Link to={homeFor(user.role)}>Back to overview</Link></Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
