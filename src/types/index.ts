export type UserStatus = "onboarding" | "waiting" | "matched";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  major: string | null;
  embedding: number[] | null;
  status: UserStatus;
  current_match_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  similarity_score: number;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface MatchPartner {
  partner_id: string;
  partner_name: string | null;
  partner_bio: string | null;
  partner_major: string | null;
  similarity_score: number;
}

export interface UserStatusInfo {
  status: UserStatus;
  current_match_id: string | null;
  partner_name: string | null;
  similarity_score: number | null;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
