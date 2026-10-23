import { describe, expect, it } from "vitest";
import { findConflicts, normalizePhone } from "@/lib/validation";

const users = [
  { id: "a", username: "Vikram.D", phone: "+91 98220 11223" },
  { id: "b", username: "meera", phone: "09876543210" },
];

describe("demo identity rules", () => {
  it("normalizes equivalent phone formats to one value", () => {
    expect(normalizePhone("098220 11223")).toBe("+919822011223");
    expect(normalizePhone("+91-98220-11223")).toBe("+919822011223");
    expect(normalizePhone("12345")).toBeNull();
  });
  it("rejects a username already used by someone else, case-insensitively", () => {
    expect(findConflicts(users, "b", "vikram.d", "9000000001").usernameTaken).toBe(true);
    expect(findConflicts(users, "a", "vikram.d", "9000000001").usernameTaken).toBe(false);
  });
  it("rejects a phone already used by someone else in another format", () => {
    expect(findConflicts(users, "a", "x", "+91 98765 43210").phoneTaken).toBe(true);
  });
});
