import { describe, expect, it } from "vitest";
import { ageFrom, roleIssues } from "@/lib/account-schema";
import { homeFor } from "@/lib/nav";

describe("role routing", () => {
  it("sends each role to its home", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("institution")).toBe("/institution");
    expect(homeFor("faculty")).toBe("/faculty");
    expect(homeFor("student")).toBe("/student");
  });
});

describe("account rules", () => {
  it("requires roll number for students", () => {
    expect(roleIssues({ role: "student" }).map((i) => i.path)).toContain("rollNumber");
  });
  it("requires permission level for admins", () => {
    expect(roleIssues({ role: "admin", designation: "x" }).map((i) => i.path)).toEqual(["permissionLevel"]);
  });
  it("computes age from date of birth", () => {
    expect(ageFrom("2004-05-06", new Date(2026, 4, 5))).toBe(21);
    expect(ageFrom("2004-05-06", new Date(2026, 4, 6))).toBe(22);
  });
});
