// Entirely fictional demo data. Not real institutions, people or AICTE records.
import type {
  Activity, AppStatus, Application, Certificate, DemoData, DocStatus, DocumentRec, Institution, Notification, User,
} from "./types";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DAY = 86400000;
function iso(offsetDays: number) {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  return new Date(d.getTime() + offsetDays * DAY).toISOString();
}

const institutions: Institution[] = ([
  ["Sahyadri Institute of Technology", "Pune", "Maharashtra", "Engineering"],
  ["Narmada Valley College of Engineering", "Jabalpur", "Madhya Pradesh", "Engineering"],
  ["Kaveri School of Management Studies", "Mysuru", "Karnataka", "Management"],
  ["Ganga Institute of Pharmacy", "Varanasi", "Uttar Pradesh", "Pharmacy"],
  ["Coromandel Polytechnic", "Chennai", "Tamil Nadu", "Diploma"],
  ["Thar Desert Institute of Architecture", "Jodhpur", "Rajasthan", "Architecture"],
  ["Brahmaputra Technical University", "Guwahati", "Assam", "Engineering"],
  ["Malabar College of Applied Sciences", "Kozhikode", "Kerala", "Applied Arts"],
  ["Deccan Institute of Computer Applications", "Hyderabad", "Telangana", "MCA"],
  ["Shivalik Engineering College", "Dehradun", "Uttarakhand", "Engineering"],
  ["Konark Institute of Hotel Management", "Bhubaneswar", "Odisha", "Hotel Mgmt"],
  ["Sabarmati Business School", "Ahmedabad", "Gujarat", "Management"],
] as [string, string, string, string][]).map(([name, city, state, type], i) => ({
  id: `inst-${i + 1}`,
  name, city, state, type,
  aicteId: `DEMO-${state.slice(0, 2).toUpperCase()}-${(1040 + i * 37).toString().padStart(5, "0")}`,
}));

export const DEMO_PERSONA_IDS = {
  admin: "u-admin",
  institution: "u-rep",
  faculty: "u-fac",
  student: "u-stu",
} as const;

const users: User[] = [
  { id: "u-admin", name: "Ananya Rao", username: "ananya.rao", email: "ananya.rao@demo-regulator.in", phone: "+919845012345", role: "admin", title: "Senior Review Officer" },
  { id: "u-rep", name: "Vikram Deshmukh", username: "vikram.d", email: "registrar@sahyadri-demo.edu.in", phone: "+919822011223", role: "institution", title: "Registrar", institutionId: "inst-1" },
  { id: "u-fac", name: "Dr. Meera Iyer", username: "meera.iyer", email: "meera.iyer@sahyadri-demo.edu.in", phone: "+919876543210", role: "faculty", title: "Associate Professor, CSE", institutionId: "inst-1" },
  { id: "u-stu", name: "Rohan Kulkarni", username: "rohan.k", email: "rohan.k@student.sahyadri-demo.edu.in", phone: "+919011223344", role: "student", title: "B.Tech Student, Year 3", institutionId: "inst-1" },
  { id: "u-rev2", name: "Sandeep Mehta", username: "sandeep.m", email: "sandeep.m@demo-regulator.in", phone: "+919811122233", role: "admin", title: "Review Officer" },
  { id: "u-rev3", name: "Farah Siddiqui", username: "farah.s", email: "farah.s@demo-regulator.in", phone: "+919900887766", role: "admin", title: "Compliance Analyst" },
  { id: "u-rep2", name: "Lakshmi Narayanan", username: "lakshmi.n", email: "office@coromandel-demo.edu.in", phone: "+919444455566", role: "institution", title: "Principal", institutionId: "inst-5" },
];

const reviewers = ["Ananya Rao", "Sandeep Mehta", "Farah Siddiqui"];
const appTypes = [
  ["Extension of Approval", "All programmes"],
  ["Increase in Intake", "B.Tech Computer Science"],
  ["New Programme", "M.Tech Data Science"],
  ["Change of Name", "Institution name"],
  ["Increase in Intake", "MBA"],
  ["New Programme", "B.Tech Artificial Intelligence"],
];
const statusPool: AppStatus[] = [
  "Under Review", "Under Review", "Submitted", "Submitted", "Query Raised", "Approved", "Approved", "Approved", "Rejected", "Draft",
];

const docTemplates: [string, string, string][] = [
  ["Land Ownership Certificate", "Legal", "District Sub-Registrar (demo)"],
  ["Building Completion Certificate", "Infrastructure", "Municipal Corporation (demo)"],
  ["Fire Safety NOC", "Safety", "State Fire Services (demo)"],
  ["Affiliation Letter", "Academic", "State Technical University (demo)"],
  ["Audited Financial Statement", "Financial", "Chartered Accountant (demo)"],
  ["Faculty Qualification Register", "Academic", "Institution (self)"],
];
const flagReasons = [
  "Issuer seal does not match reference sample (simulated)",
  "Survey number differs from application form (simulated)",
  "Date of issue later than date of submission (simulated)",
  "Signatory name not found in issuer list (simulated)",
];

function build(): DemoData {
  const r = rng(20261022);
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)]!;
  const applications: Application[] = [];
  const documents: DocumentRec[] = [];
  const certificates: Certificate[] = [];
  const activity: Activity[] = [];

  institutions.forEach((inst, i) => {
    const count = 3 + (i % 2);
    for (let k = 0; k < count; k++) {
      const n = applications.length + 1;
      const status: AppStatus = i === 0 && k === 0 ? "Query Raised" : pick(statusPool);
      const submittedAgo = 5 + Math.floor(r() * 120);
      const updatedAgo = Math.max(0, submittedAgo - Math.floor(r() * submittedAgo));
      const [type, programme] = pick(appTypes) as [string, string];
      const app: Application = {
        id: `app-${n}`,
        ref: `AV-2026-${(4100 + n * 7).toString()}`,
        institutionId: inst.id,
        type, programme, status,
        submittedOn: iso(-submittedAgo),
        updatedOn: iso(-updatedAgo),
        reviewer: pick(reviewers),
        completeness: status === "Draft" ? 40 + Math.floor(r() * 40) : status === "Query Raised" ? 70 + Math.floor(r() * 20) : 100,
      };
      applications.push(app);

      const docCount = 3 + Math.floor(r() * 3);
      for (let d = 0; d < docCount; d++) {
        const [name, category, issuer] = docTemplates[(d + k) % docTemplates.length]!;
        const roll = r();
        let st: DocStatus = status === "Approved" ? "Verified" : roll < 0.45 ? "Verified" : roll < 0.75 ? "Pending" : roll < 0.88 ? "Flagged" : "Expired";
        if (status === "Draft") st = "Pending";
        documents.push({
          id: `doc-${documents.length + 1}`,
          applicationId: app.id,
          institutionId: inst.id,
          name, category, issuer, status: st,
          uploadedOn: iso(-submittedAgo - Math.floor(r() * 5)),
          aiScore: st === "Flagged" ? 38 + Math.floor(r() * 25) : st === "Verified" ? 88 + Math.floor(r() * 11) : 65 + Math.floor(r() * 25),
          ...(st === "Flagged" ? { flagReason: pick(flagReasons) } : {}),
        });
        if (st === "Flagged" || st === "Verified" && d === 0) {
          activity.push({ id: `act-${activity.length + 1}`, at: iso(-Math.max(0, submittedAgo - 2)), actor: "Simulated AI check", actorRole: "system", action: st === "Flagged" ? "flagged document" : "verified document", target: app.ref, institutionId: inst.id, detail: `${name}: Pending → ${st}` });
        }
      }

      const rep = `${inst.name.split(" ")[0]} office (demo)`;
      activity.push({ id: `act-${activity.length + 1}`, at: app.submittedOn, actor: rep, actorRole: "institution", action: status === "Draft" ? "created draft" : "submitted", target: app.ref, institutionId: inst.id, detail: status === "Draft" ? "Status: — → Draft" : "Status: Draft → Submitted" });
      if (status !== "Draft" && status !== "Submitted") {
        const from = status === "Under Review" ? "Submitted" : "Under Review";
        activity.push({ id: `act-${activity.length + 1}`, at: app.updatedOn, actor: app.reviewer, actorRole: "admin", action: `marked ${status.toLowerCase()}`, target: app.ref, institutionId: inst.id, detail: `Status: ${from} → ${status}` });
      }
    }

    const certs: [string, string][] = [
      ["Fire Safety NOC", "State Fire Services (demo)"],
      ["Pollution Control Consent", "State Pollution Control Board (demo)"],
      ["Structural Stability Certificate", "Licensed Structural Engineer (demo)"],
    ];
    certs.forEach(([name, issuer], c) => {
      const expiresIn = i === 0 && c === 0 ? 12 : Math.floor(r() * 240) - 30;
      certificates.push({
        id: `cert-${certificates.length + 1}`,
        institutionId: inst.id, name, issuer,
        issuedOn: iso(expiresIn - 365 * (1 + (c % 2))),
        expiresOn: iso(expiresIn),
      });
    });
  });

  activity.sort((a, b) => b.at.localeCompare(a.at));

  const notifications = buildNotifications(applications, certificates, institutions);

  return { institutions, users, applications, documents, certificates, activity, notifications };
}

export function createSeedData(): DemoData {
  return build();
}

const ago = (isoDate: string) => Math.round((Date.now() - new Date(isoDate).getTime()) / DAY);

/** Notifications derived from the same applications and certificates shown elsewhere. */
function buildNotifications(apps: Application[], certs: Certificate[], insts: Institution[]): Notification[] {
  const name = (id: string) => insts.find((i) => i.id === id)?.name ?? "";
  const out: Notification[] = [];
  for (const a of apps) {
    const base = { institutionId: a.institutionId, appId: a.id, read: ago(a.updatedOn) > 7 };
    if (a.status === "Query Raised")
      out.push({ ...base, id: `n-${a.id}-q`, at: a.updatedOn, kind: "correction", title: `Correction requested on ${a.ref}`, body: `${a.reviewer} asked ${name(a.institutionId)} to revise supporting documents.`, roles: ["admin", "institution"] });
    else if (a.status === "Approved" || a.status === "Rejected")
      out.push({ ...base, id: `n-${a.id}-s`, at: a.updatedOn, kind: "status", title: `${a.ref} ${a.status.toLowerCase()}`, body: `${a.type} for ${name(a.institutionId)} was ${a.status.toLowerCase()}.`, roles: ["admin", "institution"] });
    else if (a.status === "Under Review")
      out.push({ ...base, id: `n-${a.id}-r`, at: a.updatedOn, kind: "review", title: `${a.ref} is under review`, body: `${a.reviewer} picked up the ${a.type.toLowerCase()} application.`, roles: ["admin", "institution"] });
  }
  for (const c of certs) {
    const left = -ago(c.expiresOn);
    if (left > 30 || left < -30) continue;
    out.push({
      id: `n-${c.id}-e`, at: iso(Math.min(0, left - 30) > -365 ? Math.max(-ago(c.expiresOn) - 30, -20) : 0), kind: "expiry", institutionId: c.institutionId, read: left < 0,
      title: left < 0 ? `${c.name} expired ${-left} days ago` : `${c.name} expires in ${left} days`,
      body: `${name(c.institutionId)} — upload a renewed certificate.`, roles: ["admin", "institution", "faculty"],
    });
  }
  out.push(
    { id: "n-fac-1", at: iso(-3), kind: "general", title: "Faculty register update requested", body: "Please confirm your qualification details by Friday.", read: false, roles: ["faculty"], institutionId: "inst-1" },
    { id: "n-stu-1", at: iso(-4), kind: "general", title: "Scholarship document window open", body: "Students may upload fee receipts for the demo scholarship drive.", read: false, roles: ["student"], institutionId: "inst-1" },
  );
  return out.map((n) => (new Date(n.at).getTime() > Date.now() ? { ...n, at: iso(0) } : n)).sort((a, b) => b.at.localeCompare(a.at));
}
