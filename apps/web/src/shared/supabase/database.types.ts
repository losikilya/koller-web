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
      playground_user_data: {
        Row: {
          app_key: string
          created_at: string
          data_key: string
          id: string
          payload: NonNullable<Json>
          revision: number
          schema_version: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          app_key: string
          created_at?: string
          data_key: string
          id?: string
          payload?: NonNullable<Json>
          revision?: number
          schema_version?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          app_key?: string
          created_at?: string
          data_key?: string
          id?: string
          payload?: NonNullable<Json>
          revision?: number
          schema_version?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'playground_user_data_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          }
        ]
      }
      profile_privacy: {
        Row: {
          discoverable: boolean
          revision: number
          show_activity: boolean
          updated_at: string
          user_id: string
          visibility: string
        }
        ComputedFields: never
        Insert: {
          discoverable?: boolean
          revision?: number
          show_activity?: boolean
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          discoverable?: boolean
          revision?: number
          show_activity?: boolean
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_privacy_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          }
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string
          completed_at: string | null
          created_at: string
          deletion_requested_at: string | null
          display_name: string
          revision: number
          updated_at: string
          user_id: string
          username: string | null
        }
        ComputedFields: never
        Insert: {
          avatar_path?: string | null
          bio?: string
          completed_at?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string
          revision?: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string
          completed_at?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string
          revision?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          locale: string
          revision: number
          theme: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          locale?: string
          revision?: number
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          locale?: string
          revision?: number
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_own_profile: {
        Args: {
          p_expected_privacy_revision: number
          p_expected_profile_revision: number
          p_patch: Json
        }
        Returns: undefined
      }
      delete_own_playground_data: {
        Args: {
          p_app_key: string
          p_data_key: string
          p_expected_revision: number
        }
        Returns: undefined
      }
      ensure_profile: { Args: Record<PropertyKey, never>; Returns: undefined }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          bio: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_public_profile_by_username: {
        Args: { p_username: string }
        Returns: {
          bio: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      list_public_profiles: {
        Args: { p_after?: string; p_limit?: number }
        Returns: {
          bio: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      put_own_playground_data: {
        Args: {
          p_app_key: string
          p_data_key: string
          p_expected_revision?: number
          p_payload: Json
          p_schema_version: number
        }
        Returns: string
      }
      set_own_preferences: {
        Args: { p_expected_revision: number; p_locale: string; p_theme: string }
        Returns: undefined
      }
      set_own_privacy: {
        Args: {
          p_discoverable: boolean
          p_expected_revision: number
          p_visibility: string
        }
        Returns: undefined
      }
      update_own_profile: {
        Args: { p_expected_revision: number; p_patch: Json }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
      DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] &
      DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
