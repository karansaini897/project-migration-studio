export type Role = "admin" | "institution" | "faculty" | "student";

export type AppStatus = "Draft" | "Submitted" | "Under Review" | "Query Raised" | "Approved" | "Rejected";
export type DocStatus = "Verified" | "Pending" | "Expired" | "Flagged";

export interface Institution {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  aicteId: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: Role;
  title: string;
  institutionId?: string;
  photo?: string;
}

export interface Application {
  id: string;
  ref: string;
  institutionId: string;
  type: string;
  programme: string;
  status: AppStatus;
  submittedOn: string;
  updatedOn: string;
  reviewer: string;
  completeness: number;
}

export interface DocumentRec {
  id: string;
  applicationId: string;
  institutionId: string;
  name: string;
  category: string;
  issuer: string;
  status: DocStatus;
  uploadedOn: string;
  /** Simulated AI confidence score (demo only). */
  aiScore: number;
  flagReason?: string;
}

export interface Certificate {
  id: string;
  institutionId: string;
  name: string;
  issuer: string;
  issuedOn: string;
  expiresOn: string;
}

export interface Activity {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  institutionId: string;
  /** Who acted: a portal role, or the simulated system. */
  actorRole?: Role | "system";
  /** What changed, e.g. "Status: Submitted → Under Review". */
  detail?: string;
}

export type NotificationKind = "correction" | "status" | "review" | "expiry" | "general";

export interface Notification {
  id: string;
  at: string;
  title: string;
  body: string;
  read: boolean;
  roles: Role[];
  kind?: NotificationKind;
  /** Limits non-admin visibility to one institution. */
  institutionId?: string;
  appId?: string;
}

export interface DemoData {
  institutions: Institution[];
  users: User[];
  applications: Application[];
  documents: DocumentRec[];
  certificates: Certificate[];
  activity: Activity[];
  notifications: Notification[];
}
