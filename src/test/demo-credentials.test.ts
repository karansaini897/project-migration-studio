import { describe, expect, it } from "vitest";
import { checkDemoCredentials } from "@/lib/demo-credentials";

describe("demo credentials", () => {
  it("admin / Admin123 signs in as admin", () => expect(checkDemoCredentials("admin", "Admin123")).toBe("admin"));
  it("institution / Inst123 signs in as institution", () => expect(checkDemoCredentials("institution", "Inst123")).toBe("institution"));
  it("faculty / Faculty123 signs in as faculty", () => expect(checkDemoCredentials("faculty", "Faculty123")).toBe("faculty"));
  it("student / Student123 signs in as student", () => expect(checkDemoCredentials("student", "Student123")).toBe("student"));
  it("rejects a wrong password", () => expect(checkDemoCredentials("admin", "admin123")).toBeNull());
  it("rejects another account's password", () => expect(checkDemoCredentials("student", "Admin123")).toBeNull());
  it("rejects unknown usernames", () => expect(checkDemoCredentials("root", "Admin123")).toBeNull());
});
