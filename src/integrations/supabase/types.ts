export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
        Relationships: []
      }
      bank_balances: {
        Row: {
          balance: number
          bank_name: string
          created_at: string
          id: string
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          bank_name: string
          created_at?: string
          id?: string
          month_year?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          bank_name?: string
          created_at?: string
          id?: string
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          planned_amount: number
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
          planned_amount?: number
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
          planned_amount?: number
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
          },
        ]
      }
      budget_plans: {
        Row: {
          created_at: string
          created_by: string | null
          group_id: string | null
          id: string
          month_year: string
          name: string
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
          name?: string
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
          name?: string
          status?: string | null
          total_expenses_planned?: number | null
          total_income_planned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
        ]
      }
      credit_cards: {
        Row: {
          available_credit: number
          card_name: string
          created_at: string
          credit_limit: number
          id: string
          month_year: string
          outstanding_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_credit?: number
          card_name: string
          created_at?: string
          credit_limit?: number
          id?: string
          month_year?: string
          outstanding_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_credit?: number
          card_name?: string
          created_at?: string
          credit_limit?: number
          id?: string
          month_year?: string
          outstanding_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_groups: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          group_code: string
          id: string
          is_active: boolean | null
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          group_code: string
          id?: string
          is_active?: boolean | null
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          group_code?: string
          id?: string
          is_active?: boolean | null
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          amount: number
          created_at: string
          due_date: number | null
          expense_name: string
          id: string
          is_paid: boolean
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: number | null
          expense_name: string
          id?: string
          is_paid?: boolean
          month_year?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: number | null
          expense_name?: string
          id?: string
          is_paid?: boolean
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      floating_expenses: {
        Row: {
          amount: number
          created_at: string
          expense_name: string
          id: string
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          expense_name: string
          id?: string
          month_year?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_name?: string
          id?: string
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          group_id: string
          id: string
          invited_by: string
          status: string | null
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          group_id: string
          id?: string
          invited_by: string
          status?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          group_id?: string
          id?: string
          invited_by?: string
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expense_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
          email?: string
          group_id?: string
          id?: string
          invited_by?: string
          joined_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          created_at: string
          errors: Json | null
          failed_rows: number | null
          file_name: string | null
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
          file_name?: string | null
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
          file_name?: string | null
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
          },
        ]
      }
      income: {
        Row: {
          amount: number
          created_at: string
          id: string
          month_year: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          month_year?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month_year?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance: {
        Row: {
          company_name: string
          created_at: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          name: string
          nominees: string[] | null
          policy_end_date: string | null
          policy_number: string
          policy_start_date: string | null
          policy_type: string
          premium_amount: number
          premium_due_date: number | null
          premium_frequency: string
          sum_assured: number
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          nominees?: string[] | null
          policy_end_date?: string | null
          policy_number: string
          policy_start_date?: string | null
          policy_type: string
          premium_amount: number
          premium_due_date?: number | null
          premium_frequency: string
          sum_assured: number
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          nominees?: string[] | null
          policy_end_date?: string | null
          policy_number?: string
          policy_start_date?: string | null
          policy_type?: string
          premium_amount?: number
          premium_due_date?: number | null
          premium_frequency?: string
          sum_assured?: number
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          created_at: string | null
          current_value: number
          group_id: string | null
          id: string
          invested_amount: number
          investment_type: string
          is_active: boolean | null
          lock_in_period: number | null
          maturity_date: string | null
          name: string
          nav: number | null
          platform: string
          sip_amount: number | null
          sip_date: number | null
          units: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value: number
          group_id?: string | null
          id?: string
          invested_amount: number
          investment_type: string
          is_active?: boolean | null
          lock_in_period?: number | null
          maturity_date?: string | null
          name: string
          nav?: number | null
          platform: string
          sip_amount?: number | null
          sip_date?: number | null
          units?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number
          group_id?: string | null
          id?: string
          invested_amount?: number
          investment_type?: string
          is_active?: boolean | null
          lock_in_period?: number | null
          maturity_date?: string | null
          name?: string
          nav?: number | null
          platform?: string
          sip_amount?: number | null
          sip_date?: number | null
          units?: number | null
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          bank_name: string
          created_at: string | null
          current_balance: number
          emi_amount: number
          emi_date: number | null
          end_date: string | null
          group_id: string | null
          id: string
          interest_rate: number
          is_active: boolean | null
          loan_type: string
          name: string
          principal_amount: number
          start_date: string | null
          tenure_months: number
          user_id: string
        }
        Insert: {
          bank_name: string
          created_at?: string | null
          current_balance: number
          emi_amount: number
          emi_date?: number | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          interest_rate: number
          is_active?: boolean | null
          loan_type: string
          name: string
          principal_amount: number
          start_date?: string | null
          tenure_months: number
          user_id: string
        }
        Update: {
          bank_name?: string
          created_at?: string | null
          current_balance?: number
          emi_amount?: number
          emi_date?: number | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          interest_rate?: number
          is_active?: boolean | null
          loan_type?: string
          name?: string
          principal_amount?: number
          start_date?: string | null
          tenure_months?: number
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          created_at: string | null
          current_value: number
          group_id: string | null
          id: string
          is_active: boolean | null
          loan_account_id: string | null
          maintenance_cost: number | null
          name: string
          ownership_percentage: number | null
          property_tax: number | null
          property_type: string
          purchase_date: string | null
          purchase_price: number
          rental_income: number | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          current_value: number
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          loan_account_id?: string | null
          maintenance_cost?: number | null
          name: string
          ownership_percentage?: number | null
          property_tax?: number | null
          property_type: string
          purchase_date?: string | null
          purchase_price: number
          rental_income?: number | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          current_value?: number
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          loan_account_id?: string | null
          maintenance_cost?: number | null
          name?: string
          ownership_percentage?: number | null
          property_tax?: number | null
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number
          rental_income?: number | null
          user_id?: string
        }
        Relationships: []
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
        ]
      }
      transactions: {
        Row: {
          account_name: string | null
          amount: number
          budget_item_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          external_id: string | null
          group_id: string | null
          id: string
          is_recurring: boolean | null
          member_email: string | null
          notes: string | null
          payment_method: string | null
          source: string | null
          transaction_date: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          amount: number
          budget_item_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          external_id?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          member_email?: string | null
          notes?: string | null
          payment_method?: string | null
          source?: string | null
          transaction_date?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          amount?: number
          budget_item_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          external_id?: string | null
          group_id?: string | null
          id?: string
          is_recurring?: boolean | null
          member_email?: string | null
          notes?: string | null
          payment_method?: string | null
          source?: string | null
          transaction_date?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_group_id: string | null
          email: string
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_group_id?: string | null
          email: string
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_group_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
