import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AppStatus, DocStatus } from "@/data/types";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneCls: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-muted-foreground",
};

const statusTone: Record<AppStatus | DocStatus | string, Tone> = {
  Approved: "success", Verified: "success",
  "Under Review": "info", Submitted: "info",
  "Query Raised": "warning", Pending: "warning",
  Rejected: "danger", Flagged: "danger", Expired: "danger",
  Draft: "neutral",
};

export function StatusBadge({ status, tone }: { status: string; tone?: Tone }) {
  const t = tone ?? statusTone[status] ?? "neutral";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", toneCls[t])}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

export function SimulatedTag() {
  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-warning/50 bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
      Simulated
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel min-w-0", className)}>
      {title && (
        <header className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: number | string; hint?: string | undefined; tone?: Tone | undefined }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular">{value}</p>
      {hint && <p className={cn("mt-1 text-xs", tone ? toneCls[tone].split(" ")[1] : "text-muted-foreground")}>{hint}</p>}
    </div>
  );
}

export function initials(name: string) {
  return name.replace(/^Dr\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
