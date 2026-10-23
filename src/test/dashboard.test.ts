import { describe, expect, it } from "vitest";
import { adminSummary, queryApplications, type AppQuery } from "@/data/dashboard";
import type { Application } from "@/data/types";

const app = (id: string, status: Application["status"], type = "Extension", submittedOn = "2026-01-01"): Application => ({
  id, ref: `REF-${id}`, institutionId: "i1", type, programme: "B.Tech", status, submittedOn, updatedOn: submittedOn, reviewer: "x", completeness: 50,
});
const apps = [app("1", "Submitted"), app("2", "Under Review"), app("3", "Approved"), app("4", "Query Raised", "New"), app("5", "Rejected")];
const base: AppQuery = { q: "", status: "all", type: "all", sort: "ref", dir: "asc", page: 1, pageSize: 2 };

describe("admin dashboard data", () => {
  it("pending reviews count submitted and under review", () => {
    expect(adminSummary({ applications: apps, certificates: [] }).pending).toBe(2);
  });
  it("needing corrections counts query raised", () => {
    expect(adminSummary({ applications: apps, certificates: [] }).corrections).toBe(1);
  });
  it("paginates and clamps page", () => {
    const r = queryApplications(apps, () => "Inst", { ...base, page: 9 });
    expect(r.pages).toBe(3);
    expect(r.page).toBe(3);
    expect(r.rows.map((a) => a.id)).toEqual(["5"]);
  });
  it("filters by status and category", () => {
    expect(queryApplications(apps, () => "", { ...base, type: "New" }).total).toBe(1);
    expect(queryApplications(apps, () => "", { ...base, status: "Approved" }).rows[0]!.id).toBe("3");
  });
});
