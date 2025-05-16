export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      invites: {
        Row: {
          created_at: string
          deleted_at: string | null
          expires_at: string
          id: string
          pair_id: string | null
          recipient_email: string
          sender_email: string | null
          sender_id: string
          site_url: string | null
          status: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          id?: string
          pair_id?: string | null
          recipient_email: string
          sender_email?: string | null
          sender_id: string
          site_url?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          id?: string
          pair_id?: string | null
          recipient_email?: string
          sender_email?: string | null
          sender_id?: string
          site_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pair_details"
            referencedColumns: ["pair_id"]
          },
          {
            foreignKeyName: "invites_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pairs: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_1_id: string
          user_2_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_1_id: string
          user_2_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_1_id?: string
          user_2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairs_user_1_id_fkey"
            columns: ["user_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairs_user_2_id_fkey"
            columns: ["user_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_active_at: string | null
          theme_preference: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          last_active_at?: string | null
          theme_preference?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          theme_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          pair_id: string
          point_cost: number
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          pair_id: string
          point_cost: number
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          pair_id?: string
          point_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "rewards_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pair_details"
            referencedColumns: ["pair_id"]
          },
          {
            foreignKeyName: "rewards_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          pair_id: string
          points: number
          tag: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          pair_id: string
          points: number
          tag: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          pair_id?: string
          points?: number
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pair_details"
            referencedColumns: ["pair_id"]
          },
          {
            foreignKeyName: "tasks_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pair_details: {
        Row: {
          created_at: string | null
          pair_id: string | null
          user_1_avatar: string | null
          user_1_id: string | null
          user_1_name: string | null
          user_2_avatar: string | null
          user_2_id: string | null
          user_2_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairs_user_1_id_fkey"
            columns: ["user_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairs_user_2_id_fkey"
            columns: ["user_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_invite_rate_limit: {
        Args: { sender_id: string }
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: { user_id: string }
        Returns: Json
      }
      get_pair_points: {
        Args: { pair_id: string }
        Returns: {
          total_earned: number
          total_spent: number
          available: number
        }[]
      }
      is_pair_member: {
        Args: { pair_id: string; user_id: string }
        Returns: boolean
      }
      set_invite_context: {
        Args: { invite_id: string }
        Returns: undefined
      }
      set_pair_context: {
        Args: { pair_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
