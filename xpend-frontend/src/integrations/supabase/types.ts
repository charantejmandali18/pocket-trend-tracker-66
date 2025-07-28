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
      accounts: {
        Row: {
          account_number_masked: string | null
          account_type: string
          balance: number | null
          bank_name: string | null
          created_at: string
          currency: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number_masked?: string | null
          account_type: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          currency?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number_masked?: string | null
          account_type?: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          currency?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_items: {
        Row: {
          budget_plan_id: string
          category_id: string
          created_at: string
          id: string
          item_type: string
          name: string
          notes: string | null
          planned_amount: number | null
          priority: string | null
        }
        Insert: {
          budget_plan_id: string
          category_id: string
          created_at?: string
          id?: string
          item_type: string
          name: string
          notes?: string | null
          planned_amount?: number | null
          priority?: string | null
        }
        Update: {
          budget_plan_id?: string
          category_id?: string
          created_at?: string
          id?: string
          item_type?: string
          name?: string
          notes?: string | null
          planned_amount?: number | null
          priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_plan_id_fkey"
            columns: ["budget_plan_id"]
            isOneToOne: false
            referencedRelation: "budget_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_plans: {
        Row: {
          created_at: string
          created_by: string | null
          group_id: string | null
          id: string
          month_year: string
          name: string | null
          status: string | null
          total_expenses_planned: number | null
          total_income_planned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          id?: string
          month_year: string
          name?: string | null
          status?: string | null
          total_expenses_planned?: number | null
          total_income_planned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          id?: string
          month_year?: string
          name?: string | null
          status?: string | null
          total_expenses_planned?: number | null
          total_income_planned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_plans_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          group_id: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      expense_groups: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          group_code: string | null
          id: string
          is_active: boolean | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          group_code?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          group_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          group_id: string
          id: string
          invited_by: string
          status: string | null
          token: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          group_id: string
          id?: string
          invited_by: string
          status?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          invited_by?: string
          status?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          created_at: string
          email: string
          group_id: string
          id: string
          invited_by: string
          joined_at: string | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          group_id: string
          id?: string
          invited_by: string
          joined_at?: string | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          group_id?: string
          id?: string
          invited_by?: string
          joined_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          errors: Json | null
          failed_rows: number | null
          file_name: string
          group_id: string | null
          id: string
          import_type: string
          status: string | null
          successful_rows: number | null
          total_rows: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          errors?: Json | null
          failed_rows?: number | null
          file_name: string
          group_id?: string | null
          id?: string
          import_type: string
          status?: string | null
          successful_rows?: number | null
          total_rows?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          errors?: Json | null
          failed_rows?: number | null
          file_name?: string
          group_id?: string | null
          id?: string
          import_type?: string
          status?: string | null
          successful_rows?: number | null
          total_rows?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      recurring_templates: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          day_of_month: number | null
          end_date: string | null
          frequency: string
          group_id: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          frequency: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          frequency?: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_templates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          account_name: string | null
          amount: number
          budget_item_id: string | null
          category_id: string
          created_at: string
          created_by: string | null
          description: string
          external_id: string | null
          group_id: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          source: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          amount: number
          budget_item_id?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          description: string
          external_id?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          source?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          amount?: number
          budget_item_id?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          external_id?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          source?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_group_id: string | null
          email: string
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_group_id?: string | null
          email: string
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_group_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_default_group_id_fkey"
            columns: ["default_group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never