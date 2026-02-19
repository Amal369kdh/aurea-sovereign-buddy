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
          id?: string
          is_pinned?: boolean
          likes_count?: number
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_initials: string | null
          birth_date: string | null
          budget_monthly: number | null
          city: string | null
          created_at: string
          daily_swipes_count: number
          display_name: string | null
          full_name: string | null
          id: string
          integration_progress: number
          interests: string[] | null
          is_premium: boolean
          is_verified: boolean
          last_swipe_reset: string
          nationality: string | null
          objectifs: string[] | null
          points: number
          revenus_monthly: number | null
          status: string
          target_city: string | null
          university: string | null
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string | null
          birth_date?: string | null
          budget_monthly?: number | null
          city?: string | null
          created_at?: string
          daily_swipes_count?: number
          display_name?: string | null
          full_name?: string | null
          id?: string
          integration_progress?: number
          interests?: string[] | null
          is_premium?: boolean
          is_verified?: boolean
          last_swipe_reset?: string
          nationality?: string | null
          objectifs?: string[] | null
          points?: number
          revenus_monthly?: number | null
          status?: string
          target_city?: string | null
          university?: string | null
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string | null
          birth_date?: string | null
          budget_monthly?: number | null
          city?: string | null
          created_at?: string
          daily_swipes_count?: number
          display_name?: string | null
          full_name?: string | null
          id?: string
          integration_progress?: number
          interests?: string[] | null
          is_premium?: boolean
          is_verified?: boolean
          last_swipe_reset?: string
          nationality?: string | null
          objectifs?: string[] | null
          points?: number
          revenus_monthly?: number | null
          status?: string
          target_city?: string | null
          university?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      announcement_category: "entraide" | "sorties" | "logement" | "general"
      connection_status: "pending" | "accepted" | "rejected"
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
    },
  },
} as const
