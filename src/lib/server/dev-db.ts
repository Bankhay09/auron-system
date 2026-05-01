import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

type DevUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  onboarding_completed: boolean;
  onboarding_data: unknown;
  theme?: string;
  created_at: string;
  updated_at: string;
};

type DevResetCode = {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
};

type DevDiaryEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  mood: number;
  progress: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type DevState = {
  users: DevUser[];
  resetCodes: DevResetCode[];
  diaryEntries: DevDiaryEntry[];
  aiMessages: unknown[];
  socialUsageLogs: unknown[];
};

const dir = join(process.cwd(), ".dev-data");
const file = join(dir, "auron-dev-db.json");

export function shouldUseDevDb() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function readDevDb(): DevState {
  mkdirSync(dir, { recursive: true });
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<DevState> & { aiInteractions?: unknown[] };
    return {
      users: parsed.users ?? [],
      resetCodes: parsed.resetCodes ?? [],
      diaryEntries: parsed.diaryEntries ?? [],
      aiMessages: parsed.aiMessages ?? parsed.aiInteractions ?? [],
      socialUsageLogs: parsed.socialUsageLogs ?? []
    };
  } catch {
    return { users: [], resetCodes: [], diaryEntries: [], aiMessages: [], socialUsageLogs: [] };
  }
}

export function writeDevDb(state: DevState) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2));
}

export function createDevId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export type { DevUser, DevResetCode, DevDiaryEntry };
