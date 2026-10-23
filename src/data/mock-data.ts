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
      }

      activity.push({ id: `act-${activity.length + 1}`, at: app.submittedOn, actor: "Institution", action: status === "Draft" ? "created draft" : "submitted", target: app.ref, institutionId: inst.id });
      if (status !== "Draft" && status !== "Submitted") {
        activity.push({ id: `act-${activity.length + 1}`, at: app.updatedOn, actor: app.reviewer, action: `marked ${status.toLowerCase()}`, target: app.ref, institutionId: inst.id });
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

  const notifications: Notification[] = [
    { id: "n1", at: iso(0), title: "Query raised on AV-2026-4107", body: "Reviewer requested a revised Land Ownership Certificate.", read: false, roles: ["institution", "admin"] },
    { id: "n2", at: iso(-1), title: "5 documents flagged by simulated AI check", body: "Demo verification found inconsistencies needing manual review.", read: false, roles: ["admin"] },
    { id: "n3", at: iso(-1), title: "Fire Safety NOC expires in 12 days", body: "Sahyadri Institute of Technology — upload a renewed certificate.", read: false, roles: ["institution", "admin", "faculty"] },
    { id: "n4", at: iso(-2), title: "New application submitted", body: "Konark Institute of Hotel Management submitted an Extension of Approval.", read: true, roles: ["admin"] },
    { id: "n5", at: iso(-3), title: "Faculty register update requested", body: "Please confirm your qualification details by Friday.", read: false, roles: ["faculty"] },
    { id: "n6", at: iso(-4), title: "Scholarship document window open", body: "Students may upload fee receipts for the demo scholarship drive.", read: false, roles: ["student"] },
    { id: "n7", at: iso(-6), title: "Weekly compliance digest ready", body: "Summary of approvals, rejections and pending items.", read: true, roles: ["admin"] },
    { id: "n8", at: iso(-8), title: "Profile verified", body: "Your contact details were confirmed (demo).", read: true, roles: ["institution", "faculty", "student"] },
  ];

  return { institutions, users, applications, documents, certificates, activity, notifications };
}

export function createSeedData(): DemoData {
  return build();
}
