export interface ValidationResult {
  validator: string;
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  filesChecked: number;
}

export interface ValidationError {
  file: string;
  field?: string;
  message: string;
  severity: "error";
}

export interface ValidationWarning {
  file: string;
  field?: string;
  message: string;
  severity: "warning";
}

export interface VaultConfig {
  vaultPath: string;
  inboxPath: string;
  beeInboxPath: string;
  rawCapturePath: string;
  meetingNotesWorkPath: string;
  meetingNotesPersonalPath: string;
  peoplePath: string;
  validGtdFolders: string[];
}

export const DEFAULT_VAULT_FOLDERS = [
  "00 Inbox",
  "00 Inbox/Bee",
  "01 Next Actions/Deep Work",
  "01 Next Actions/Quick Wins",
  "02 Personal Projects",
  "03 Family & Personal Planning",
  "04 Someday Maybe",
  "05 Reference",
  "06 Waiting For",
  "People",
];

export interface BeeFrontmatter {
  source: "bee" | "bee-initialized";
  meeting_date?: string;
  meeting_slug?: string;
  bee_conversation_id?: string | number;
  created?: string;
  last_updated?: string;
  participants?: string[];
  capture_state?: string;
}
