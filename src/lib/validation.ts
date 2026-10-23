/** Normalize an Indian phone number to +91XXXXXXXXXX, or null if invalid. */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return `+91${d}`;
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

type Identity = { id: string; username: string; phone: string };

export function findConflicts(users: Identity[], selfId: string, username: string, phone: string) {
  const u = normalizeUsername(username);
  const p = normalizePhone(phone);
  return {
    usernameTaken: users.some((x) => x.id !== selfId && normalizeUsername(x.username) === u),
    phoneTaken: !!p && users.some((x) => x.id !== selfId && normalizePhone(x.phone) === p),
    phoneInvalid: !p,
  };
}
