export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          headline: string | null;
          location: string | null;
          skills: string[];
          resume_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          headline?: string | null;
          location?: string | null;
          skills?: string[];
          resume_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          headline?: string | null;
          location?: string | null;
          skills?: string[];
          resume_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          source: string;
          external_id: string;
          company: string;
          company_initials: string | null;
          company_color: string | null;
          company_logo_url: string | null;
          title: string;
          location: string | null;
          is_remote: boolean;
          salary: string | null;
          description: string | null;
          url: string | null;
          tags: string[];
          posted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          external_id: string;
          company: string;
          company_initials?: string | null;
          company_color?: string | null;
          company_logo_url?: string | null;
          title: string;
          location?: string | null;
          is_remote?: boolean;
          salary?: string | null;
          description?: string | null;
          url?: string | null;
          tags?: string[];
          posted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          external_id?: string;
          company?: string;
          company_initials?: string | null;
          company_color?: string | null;
          company_logo_url?: string | null;
          title?: string;
          location?: string | null;
          is_remote?: boolean;
          salary?: string | null;
          description?: string | null;
          url?: string | null;
          tags?: string[];
          posted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_matches: {
        Row: {
          user_id: string;
          job_id: string;
          score: number;
          reason: string | null;
          model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          job_id: string;
          score: number;
          reason?: string | null;
          model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          job_id?: string;
          score?: number;
          reason?: string | null;
          model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_jobs: {
        Row: {
          user_id: string;
          job_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          job_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          job_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          company: string;
          role: string;
          status: Database["public"]["Enums"]["application_status"];
          applied_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          company: string;
          role: string;
          status?: Database["public"]["Enums"]["application_status"];
          applied_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          company?: string;
          role?: string;
          status?: Database["public"]["Enums"]["application_status"];
          applied_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_monitoring_events: {
        Row: {
          id: string;
          user_id: string | null;
          job_id: string | null;
          kind: Database["public"]["Enums"]["ai_event_kind"];
          status: Database["public"]["Enums"]["ai_event_status"];
          model: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          cost_usd: number | null;
          latency_ms: number | null;
          message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          job_id?: string | null;
          kind: Database["public"]["Enums"]["ai_event_kind"];
          status?: Database["public"]["Enums"]["ai_event_status"];
          model?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          cost_usd?: number | null;
          latency_ms?: number | null;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          job_id?: string | null;
          kind?: Database["public"]["Enums"]["ai_event_kind"];
          status?: Database["public"]["Enums"]["ai_event_status"];
          model?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          cost_usd?: number | null;
          latency_ms?: number | null;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      application_status:
        | "draft"
        | "applied"
        | "interviewing"
        | "offer"
        | "rejected"
        | "withdrawn";
      ai_event_kind:
        | "job_match"
        | "application_draft"
        | "job_ingestion"
        | "email_alert"
        | "error"
        | "ai_ping";
      ai_event_status: "started" | "succeeded" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
