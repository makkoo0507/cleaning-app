// DB の型定義（テーブル設計.md v1.7 に対応）

export type UserRole =
  | "contractor_admin"
  | "contractor_viewer"
  | "cleaner"
  | "contact";

// 業者側ロールの表示名
export const CONTRACTOR_ROLE_LABEL: Record<string, string> = {
  contractor_admin: "管理者",
  contractor_viewer: "閲覧者",
};

export type JobStatus = "scheduled" | "in_progress" | "completed";

export type CompanyPlan = "free" | "paid";

export interface ContractorCompany {
  id: string;
  name: string;
  plan: CompanyPlan;
  max_properties: number | null;
  max_cleaners: number | null;
  line_channel_access_token: string | null;
  line_channel_secret: string | null;
  slug: string | null;
  billing_enabled: boolean;
  reminder_to_cleaner: boolean;
  reminder_to_owner: boolean;
  reminder_prev_day: boolean;
  reminder_same_day: boolean;
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  role: UserRole;
  name: string;
  line_user_id: string | null;
  invite_token: string | null;
  created_at: string;
}

export interface ContractorMemberProfile {
  user_id: string;
  department: string | null;
  employee_code: string | null;
  note: string | null;
  created_at: string;
}

export interface CleanerProfile {
  user_id: string;
  skills: string | null;
  note: string | null;
  created_at: string;
}

export interface PropertyMemberProfile {
  user_id: string;
  company_name: string | null;
  phone: string | null;
  billing_address: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  company_id: string;
  name: string;
  address: string;
  notes: string | null;
  created_at: string;
}

export interface PropertyMember {
  user_id: string;
  property_id: string;
  role: string;
  notify: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  property_id: string;
  cleaner_id: string | null;
  scheduled_date: string;
  scheduled_start_time: string | null;
  status: JobStatus;
  billing_amount: number | null;
  payment_amount: number | null;
  created_at: string;
}

export interface CleaningRecord {
  id: string;
  job_id: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  memo: string | null;
  created_at: string;
}

// JWT app_metadata に格納されるカスタムクレーム（auth_hook 由来）
export interface AppMetadata {
  company_id?: string;
  role?: UserRole;
}

// 表示用ラベル
export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  scheduled: "予定",
  in_progress: "作業中",
  completed: "完了",
};

export const PROPERTY_MEMBER_ROLE_LABEL: Record<string, string> = {
  owner: "オーナー",
  operations: "運用担当",
  sales: "営業",
};
