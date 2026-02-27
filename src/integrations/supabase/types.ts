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
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          likes_count?: number
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
          display_name: string | null
          expertise_domains: string[] | null
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
          target_city: string | null
          titre_sejour_expiry: string | null
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
          display_name?: string | null
          expertise_domains?: string[] | null
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
          target_city?: string | null
          titre_sejour_expiry?: string | null
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
          display_name?: string | null
          expertise_domains?: string[] | null
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
          target_city?: string | null
          titre_sejour_expiry?: string | null
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
          token: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          student_email: string
          token: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          student_email?: string
          token?: string
          user_id?: string
          verified?: boolean
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
          points_social: number | null
          status: string | null
          university: string | null
          user_id: string | null
        }
        Insert: {
          avatar_initials?: string | null
          city?: string | null
          display_name?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          points_social?: number | null
          status?: string | null
          university?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_initials?: string | null
          city?: string | null
          display_name?: string | null
          interests?: string[] | null
          is_verified?: boolean | null
          points_social?: number | null
          status?: string | null
          university?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_announcements: { Args: never; Returns: undefined }
      has_dating_profile: { Args: { _user_id: string }; Returns: boolean }
      is_temoin: { Args: { _user_id: string }; Returns: boolean }
      is_verified_organization: { Args: { _user_id: string }; Returns: boolean }
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
