export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      allowed_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          university_name: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          university_name?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          university_name?: string | null
        }
        Relationships: []
      }
      announcement_likes: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_likes_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["announcement_category"]
          comments_count: number
          content: string
          created_at: string
          display_author_name: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean
          likes_count: number
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["announcement_category"]
          comments_count?: number
          content: string
          created_at?: string
          display_author_name?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          likes_count?: number
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["announcement_category"]
          comments_count?: number
          content?: string
          created_at?: string
          display_author_name?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          likes_count?: number
        }
        Relationships: []
      }
      city_resources_cache: {
        Row: {
          city: string
          data: Json
          id: string
          last_updated_at: string
          updated_by: string | null
        }
        Insert: {
          city: string
          data: Json
          id?: string
          last_updated_at?: string
          updated_by?: string | null
        }
        Update: {
          city?: string
          data?: Json
          id?: string
          last_updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          announcement_id: string
          author_id: string
          content: string
          created_at: string
          id: string
          is_solution: boolean
        }
        Insert: {
          announcement_id: string
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean
        }
        Update: {
          announcement_id?: string
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          target_id?: string
        }
        Relationships: []
      }
      dating_likes: {
        Row: {
          created_at: string
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
      }
      dating_matches: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      dating_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "dating_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_profiles: {
        Row: {
          age_max: number | null
          age_min: number | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          looking_for: string
          show_me: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          looking_for?: string
          show_me?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          looking_for?: string
          show_me?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_link_clicks: {
        Row: {
          clicked_at: string
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          clicked_at?: string
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_link_clicks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          offer: string | null
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          offer?: string | null
          type?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          offer?: string | null
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apl_status: string | null
          arrival_date: string | null
          avatar_initials: string | null
          aya_messages_used: number
          birth_date: string | null
          budget_groceries_weekly: number | null
          budget_monthly: number | null
          city: string | null
          created_at: string
          cuisine_preferences: string[] | null
          daily_swipes_count: number
          dietary: string | null
          diplome_vise: string | null
          display_name: string | null
          expertise_domains: string[] | null
          faculte: string | null
          full_name: string | null
          has_seen_welcome: boolean
          id: string
          integration_progress: number
          interests: string[] | null
          is_in_france: boolean | null
          is_premium: boolean
          is_verified: boolean
          last_swipe_reset: string
          logement_situation: string | null
          looking_for: string[] | null
          mutuelle: boolean | null
          mutuelle_nom: string | null
          nationality: string | null
          nearby_stores: string[] | null
          next_deadline_date: string | null
          next_deadline_label: string | null
          objectifs: string[] | null
          onboarding_step: number | null
          points: number
          points_social: number
          revenus_monthly: number | null
          status: string
          student_status: string | null
          suspended_until: string | null
          target_city: string | null
          titre_sejour_expiry: string | null
          type_formation: string | null
          university: string | null
          university_id: string | null
          updated_at: string
          user_id: string
          visa_type: string | null
        }
        Insert: {
          apl_status?: string | null
          arrival_date?: string | null
          avatar_initials?: string | null
          aya_messages_used?: number
          birth_date?: string | null
          budget_groceries_weekly?: number | null
          budget_monthly?: number | null
          city?: string | null
          created_at?: string
          cuisine_preferences?: string[] | null
          daily_swipes_count?: number
          dietary?: string | null
          diplome_vise?: string | null
          display_name?: string | null
          expertise_domains?: string[] | null
          faculte?: string | null
          full_name?: string | null
          has_seen_welcome?: boolean
          id?: string
          integration_progress?: number
          interests?: string[] | null
          is_in_france?: boolean | null
          is_premium?: boolean
          is_verified?: boolean
          last_swipe_reset?: string
          logement_situation?: string | null
          looking_for?: string[] | null
          mutuelle?: boolean | null
          mutuelle_nom?: string | null
          nationality?: string | null
          nearby_stores?: string[] | null
          next_deadline_date?: string | null
          next_deadline_label?: string | null
          objectifs?: string[] | null
          onboarding_step?: number | null
          points?: number
          points_social?: number
          revenus_monthly?: number | null
          status?: string
          student_status?: string | null
          suspended_until?: string | null
          target_city?: string | null
          titre_sejour_expiry?: string | null
          type_formation?: string | null
          university?: string | null
          university_id?: string | null
          updated_at?: string
          user_id: string
          visa_type?: string | null
        }
        Update: {
          apl_status?: string | null
          arrival_date?: string | null
          avatar_initials?: string | null
          aya_messages_used?: number
          birth_date?: string | null
          budget_groceries_weekly?: number | null
          budget_monthly?: number | null
          city?: string | null
          created_at?: string
          cuisine_preferences?: string[] | null
          daily_swipes_count?: number
          dietary?: string | null
          diplome_vise?: string | null
          display_name?: string | null
          expertise_domains?: string[] | null
          faculte?: string | null
          full_name?: string | null
          has_seen_welcome?: boolean
          id?: string
          integration_progress?: number
          interests?: string[] | null
          is_in_france?: boolean | null
          is_premium?: boolean
          is_verified?: boolean
          last_swipe_reset?: string
          logement_situation?: string | null
          looking_for?: string[] | null
          mutuelle?: boolean | null
          mutuelle_nom?: string | null
          nationality?: string | null
          nearby_stores?: string[] | null
          next_deadline_date?: string | null
          next_deadline_label?: string | null
          objectifs?: string[] | null
          onboarding_step?: number | null
          points?: number
          points_social?: number
          revenus_monthly?: number | null
          status?: string
          student_status?: string | null
          suspended_until?: string | null
          target_city?: string | null
          titre_sejour_expiry?: string | null
          type_formation?: string | null
          university?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string
          visa_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_announcement_id: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_announcement_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_announcement_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_announcement_id_fkey"
            columns: ["reported_announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      resources_links: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          is_verified: boolean
          organization_id: string | null
          title: string
          url: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean
          organization_id?: string | null
          title: string
          url: string
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean
          organization_id?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      solution_conversations: {
        Row: {
          announcement_id: string
          comment_id: string
          created_at: string
          helper_id: string
          helper_msg_count: number
          id: string
          post_author_id: string
          post_author_msg_count: number
        }
        Insert: {
          announcement_id: string
          comment_id: string
          created_at?: string
          helper_id: string
          helper_msg_count?: number
          id?: string
          post_author_id: string
          post_author_msg_count?: number
        }
        Update: {
          announcement_id?: string
          comment_id?: string
          created_at?: string
          helper_id?: string
          helper_msg_count?: number
          id?: string
          post_author_id?: string
          post_author_msg_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "solution_conversations_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_conversations_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: true
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      solution_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solution_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "solution_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_email_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          student_email: string
          token: string | null
          token_hash: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          student_email: string
          token?: string | null
          token_hash: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          student_email?: string
          token?: string | null
          token_hash?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string
          created_at: string
          id: string
          name: string
          short_name: string | null
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          name: string
          short_name?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          document_id: string
          id: string
          owned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          document_id: string
          id?: string
          owned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          document_id?: string
          id?: string
          owned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          done: boolean
          id: string
          phase_id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          done?: boolean
          id?: string
          phase_id: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          done?: boolean
          id?: string
          phase_id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_initials: string | null
          city: string | null
          display_name: string | null
          interests: string[] | null
          is_verified: boolean | null
          objectifs: string[] | null
          points_social: number | null
          status: string | null
          target_city: string | null
          university: string | null
          user_id: string | null
        }
        Insert: {
          avatar_initials?: string | null
          city?: string | null
          display_name?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          objectifs?: string[] | null
          points_social?: number | null
          status?: string | null
          target_city?: string | null
          university?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_initials?: string | null
          city?: string | null
          display_name?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          objectifs?: string[] | null
          points_social?: number | null
          status?: string | null
          target_city?: string | null
          university?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_increment_aya_usage: {
        Args: { p_is_premium: boolean; p_limit: number; p_user_id: string }
        Returns: Json
      }
      check_profile_update_allowed: {
        Args: {
          p_new_is_premium: boolean
          p_new_is_verified: boolean
          p_new_status: string
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_expired_announcements: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_own_profile_status: { Args: { _user_id: string }; Returns: string }
      has_dating_profile: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_student_verified: { Args: { _user_id: string }; Returns: boolean }
      is_temoin: { Args: { _user_id: string }; Returns: boolean }
      is_verified_organization: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      announcement_category: "entraide" | "sorties" | "logement" | "general"
      connection_status: "pending" | "accepted" | "rejected"
      resource_category:
        | "jobs"
        | "alternance"
        | "sante"
        | "social"
        | "reorientation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_category: ["entraide", "sorties", "logement", "general"],
      connection_status: ["pending", "accepted", "rejected"],
      resource_category: [
        "jobs",
        "alternance",
        "sante",
        "social",
        "reorientation",
      ],
    },
  },
} as const
