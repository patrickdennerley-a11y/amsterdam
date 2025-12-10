export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          bio: string | null;
          major: string | null;
          embedding: number[] | null;
          status: "onboarding" | "waiting" | "matched";
          current_match_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          bio?: string | null;
          major?: string | null;
          embedding?: number[] | null;
          status?: "onboarding" | "waiting" | "matched";
          current_match_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          bio?: string | null;
          major?: string | null;
          embedding?: number[] | null;
          status?: "onboarding" | "waiting" | "matched";
          current_match_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          similarity_score: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          similarity_score?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a_id?: string;
          user_b_id?: string;
          similarity_score?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      match_user_atomically: {
        Args: { p_target_user_id: string };
        Returns: string | null;
      };
      run_batch_matching: {
        Args: { p_admin_email: string };
        Returns: number;
      };
      unmatch_users: {
        Args: { p_match_id: string; p_requesting_user_id: string };
        Returns: boolean;
      };
      get_match_partner: {
        Args: { p_match_id: string; p_user_id: string };
        Returns: {
          partner_id: string;
          partner_name: string | null;
          partner_bio: string | null;
          partner_major: string | null;
          similarity_score: number;
        }[];
      };
      get_user_status: {
        Args: { p_user_id: string };
        Returns: {
          status: "onboarding" | "waiting" | "matched";
          current_match_id: string | null;
          partner_name: string | null;
          similarity_score: number | null;
        }[];
      };
      users_previously_matched: {
        Args: { p_user_a: string; p_user_b: string };
        Returns: boolean;
      };
    };
  };
}
