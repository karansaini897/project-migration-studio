import type { Activity, Certificate, Institution } from "@/data/types";
import { daysUntil, fmtDate, relTime } from "@/data/selectors";
import { Empty, StatusBadge } from "./ui-bits";

export function ExpiryList({ certs, institutions, limit = 6 }: { certs: Certificate[]; institutions: Institution[]; limit?: number }) {
  const list = [...certs].filter((c) => daysUntil(c.expiresOn) >= -30).sort((a, b) => a.expiresOn.localeCompare(b.expiresOn)).slice(0, limit);
  if (!list.length) return <Empty>No upcoming expiries.</Empty>;
  return (
    <ul className="divide-y">
      {list.map((c) => {
        const n = daysUntil(c.expiresOn);
        const inst = institutions.find((i) => i.id === c.institutionId);
        return (
          <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{inst?.name} · {fmtDate(c.expiresOn)}</p>
            </div>
            <StatusBadge status={n < 0 ? `Expired ${-n}d ago` : `${n} days`} tone={n < 0 ? "danger" : n <= 30 ? "warning" : "neutral"} />
          </li>
        );
      })}
    </ul>
  );
}

export function ActivityFeed({ items, institutions, limit = 8 }: { items: Activity[]; institutions: Institution[]; limit?: number }) {
  if (!items.length) return <Empty>No recent activity.</Empty>;
  return (
    <ol className="divide-y">
      {items.slice(0, limit).map((a) => (
        <li key={a.id} className="flex gap-3 px-5 py-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/60" />
          <div className="min-w-0 text-sm">
            <p><span className="font-medium">{a.actor}</span> {a.action} <span className="font-mono text-xs">{a.target}</span></p>
            <p className="truncate text-xs text-muted-foreground">{institutions.find((i) => i.id === a.institutionId)?.name} · {relTime(a.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
