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
      activity_logs: {
        Row: {
          action: string
          business_id: string
          changes_summary: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          business_id: string
          changes_summary?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          business_id?: string
          changes_summary?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_schedule_insights: {
        Row: {
          business_id: string
          confidence_score: number | null
          created_at: string
          id: string
          insights_data: Json
          learning_period: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          insights_data?: Json
          learning_period?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          insights_data?: Json
          learning_period?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_schedule_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_settings: {
        Row: {
          announcement_text: string
          business_id: string
          created_at: string
          custom_message: string | null
          emoji: string | null
          gif_url: string | null
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number
          supports_gif: boolean | null
          title: string | null
          updated_at: string
        }
        Insert: {
          announcement_text: string
          business_id: string
          created_at?: string
          custom_message?: string | null
          emoji?: string | null
          gif_url?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount: number
          supports_gif?: boolean | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          announcement_text?: string
          business_id?: string
          created_at?: string
          custom_message?: string | null
          emoji?: string | null
          gif_url?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          supports_gif?: boolean | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          created_at: string
          error_message: string | null
          id: string
          reminder_time: string
          reminder_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          reminder_time: string
          reminder_type: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          reminder_time?: string
          reminder_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string
          business_id: string
          cancellation_reason: string | null
          confirmation_sent: boolean | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          deposit_paid: number | null
          end_time: string
          id: string
          notes: string | null
          provider_id: string
          reminder_sent: boolean | null
          service_id: string
          start_time: string
          status: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: string
          business_id: string
          cancellation_reason?: string | null
          confirmation_sent?: boolean | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deposit_paid?: number | null
          end_time: string
          id?: string
          notes?: string | null
          provider_id: string
          reminder_sent?: boolean | null
          service_id: string
          start_time: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: string
          business_id?: string
          cancellation_reason?: string | null
          confirmation_sent?: boolean | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deposit_paid?: number | null
          end_time?: string
          id?: string
          notes?: string | null
          provider_id?: string
          reminder_sent?: boolean | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_overrides: {
        Row: {
          business_id: string
          created_at: string
          end_time: string | null
          id: string
          is_available: boolean
          override_date: string
          reason: string | null
          start_time: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          override_date: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          override_date?: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      break_records: {
        Row: {
          break_duration: number | null
          break_end: string | null
          break_start: string
          break_type: string | null
          business_id: string
          created_at: string
          id: string
          is_paid: boolean | null
          notes: string | null
          timesheet_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          break_duration?: number | null
          break_end?: string | null
          break_start: string
          break_type?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          timesheet_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          break_duration?: number | null
          break_end?: string | null
          break_start?: string
          break_type?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          timesheet_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_records_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          business_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_closed: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          business_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_closed?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          business_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_closed?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invitations: {
        Row: {
          business_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          position_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          used_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          position_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          used_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          position_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_pos_settings: {
        Row: {
          business_id: string
          created_at: string
          id: string
          manager_notification_enabled: boolean | null
          minimum_sale_amount: number | null
          require_manager_approval: boolean | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          manager_notification_enabled?: boolean | null
          minimum_sale_amount?: number | null
          require_manager_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          manager_notification_enabled?: boolean | null
          minimum_sale_amount?: number | null
          require_manager_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          invitation_code: string
          name: string
          owner_user_id: string
          phone: string | null
          settings: Json | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invitation_code: string
          name: string
          owner_user_id: string
          phone?: string | null
          settings?: Json | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invitation_code?: string
          name?: string
          owner_user_id?: string
          phone?: string | null
          settings?: Json | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_drawer_operations: {
        Row: {
          amount: number | null
          business_id: string
          created_at: string
          expected_amount: number | null
          id: string
          notes: string | null
          operation_type: string
          receipt_number: string | null
          store_id: string
          till_session_id: string | null
          user_id: string
          variance: number | null
        }
        Insert: {
          amount?: number | null
          business_id: string
          created_at?: string
          expected_amount?: number | null
          id?: string
          notes?: string | null
          operation_type: string
          receipt_number?: string | null
          store_id: string
          till_session_id?: string | null
          user_id: string
          variance?: number | null
        }
        Update: {
          amount?: number | null
          business_id?: string
          created_at?: string
          expected_amount?: number | null
          id?: string
          notes?: string | null
          operation_type?: string
          receipt_number?: string | null
          store_id?: string
          till_session_id?: string | null
          user_id?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_drawer_operations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_drawer_operations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      chargeback_activity_log: {
        Row: {
          action_description: string
          action_type: string
          created_at: string
          dispute_id: string
          id: string
          new_value: string | null
          previous_value: string | null
          user_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string
          dispute_id: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string
          dispute_id?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chargeback_activity_log_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "chargeback_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      chargeback_disputes: {
        Row: {
          acquiring_bank: string | null
          ai_generated_response: string | null
          assigned_to: string | null
          bank_contact_info: string | null
          bank_name: string | null
          business_id: string
          case_number: string
          chargeback_date: string
          chargeback_reason: string
          created_at: string
          created_by: string
          currency: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          dispute_amount: number
          dispute_description: string | null
          final_response_sent: string | null
          id: string
          merchant_category_code: string | null
          notes: string | null
          outcome_notes: string | null
          priority: string
          response_deadline: string
          response_sent_date: string | null
          status: string
          transaction_date: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          acquiring_bank?: string | null
          ai_generated_response?: string | null
          assigned_to?: string | null
          bank_contact_info?: string | null
          bank_name?: string | null
          business_id: string
          case_number: string
          chargeback_date: string
          chargeback_reason: string
          created_at?: string
          created_by: string
          currency?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          dispute_amount: number
          dispute_description?: string | null
          final_response_sent?: string | null
          id?: string
          merchant_category_code?: string | null
          notes?: string | null
          outcome_notes?: string | null
          priority?: string
          response_deadline: string
          response_sent_date?: string | null
          status?: string
          transaction_date: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          acquiring_bank?: string | null
          ai_generated_response?: string | null
          assigned_to?: string | null
          bank_contact_info?: string | null
          bank_name?: string | null
          business_id?: string
          case_number?: string
          chargeback_date?: string
          chargeback_reason?: string
          created_at?: string
          created_by?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          dispute_amount?: number
          dispute_description?: string | null
          final_response_sent?: string | null
          id?: string
          merchant_category_code?: string | null
          notes?: string | null
          outcome_notes?: string | null
          priority?: string
          response_deadline?: string
          response_sent_date?: string | null
          status?: string
          transaction_date?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chargeback_evidence: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          evidence_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_primary: boolean | null
          mime_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          evidence_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          evidence_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chargeback_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "chargeback_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      chargeback_response_templates: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          dispute_reason: string
          id: string
          is_active: boolean | null
          template_content: string
          template_name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          dispute_reason: string
          id?: string
          is_active?: boolean | null
          template_content: string
          template_name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          dispute_reason?: string
          id?: string
          is_active?: boolean | null
          template_content?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          ai_confidence: number | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_ai_generated: boolean | null
          message_type: string
          metadata: Json | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          ai_confidence?: number | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          ai_confidence?: number | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "customer_service_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          item_text: string
          requires_note: boolean | null
          requires_photo: boolean | null
        }
        Insert: {
          checklist_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          item_text: string
          requires_note?: boolean | null
          requires_photo?: boolean | null
        }
        Update: {
          checklist_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          item_text?: string
          requires_note?: boolean | null
          requires_photo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          business_id: string
          checklist_type: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          checklist_type: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          name: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          checklist_type?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commission_payments: {
        Row: {
          business_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          is_paid: boolean | null
          notes: string | null
          order_id: string | null
          paid_at: string | null
          payment_period: string
          payment_type: string
          sale_amount: number
          tier_name: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_period: string
          payment_type: string
          sale_amount: number
          tier_name?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_period?: string
          payment_type?: string
          sale_amount?: number
          tier_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "historical_orders_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tiers: {
        Row: {
          bonus_amount: number | null
          business_id: string
          commission_rate: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          role_type: string
          target_amount: number
          target_period: string | null
          tier_number: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bonus_amount?: number | null
          business_id: string
          commission_rate: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          role_type: string
          target_amount: number
          target_period?: string | null
          tier_number: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bonus_amount?: number | null
          business_id?: string
          commission_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role_type?: string
          target_amount?: number
          target_period?: string | null
          tier_number?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_tiers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
          status: string
          submission_type: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string
          submission_type?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string
          submission_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_codes: {
        Row: {
          business_id: string
          code: string
          created_at: string
          discount_id: string
          id: string
          is_single_use: boolean | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          discount_id: string
          id?: string
          is_single_use?: boolean | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          discount_id?: string
          id?: string
          is_single_use?: boolean | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_coupon_codes_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coupon_codes_discount"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_communications: {
        Row: {
          business_id: string
          communication_type: string
          content: string | null
          created_at: string
          customer_id: string
          direction: string
          id: string
          response_date: string | null
          response_received: boolean | null
          sent_at: string
          sent_by: string | null
          subject: string | null
        }
        Insert: {
          business_id: string
          communication_type: string
          content?: string | null
          created_at?: string
          customer_id: string
          direction?: string
          id?: string
          response_date?: string | null
          response_received?: boolean | null
          sent_at?: string
          sent_by?: string | null
          subject?: string | null
        }
        Update: {
          business_id?: string
          communication_type?: string
          content?: string | null
          created_at?: string
          customer_id?: string
          direction?: string
          id?: string
          response_date?: string | null
          response_received?: boolean | null
          sent_at?: string
          sent_by?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_communications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          preference_category: string
          preference_value: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          preference_category: string
          preference_value: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          preference_category?: string
          preference_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_service_conversations: {
        Row: {
          ai_summary: string | null
          assigned_to: string | null
          business_id: string
          category: string | null
          created_at: string
          customer_id: string | null
          id: string
          last_message_at: string | null
          priority: string
          resolution_notes: string | null
          satisfaction_rating: number | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          assigned_to?: string | null
          business_id: string
          category?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          priority?: string
          resolution_notes?: string | null
          satisfaction_rating?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          assigned_to?: string | null
          business_id?: string
          category?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          priority?: string
          resolution_notes?: string | null
          satisfaction_rating?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_service_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_support_conversations: {
        Row: {
          business_name: string | null
          channel: string
          created_at: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          escalated_at: string | null
          escalation_reason: string | null
          id: string
          issue_type: string
          last_message_at: string | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          satisfaction_rating: number | null
          status: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          channel?: string
          created_at?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          issue_type?: string
          last_message_at?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          channel?: string
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          issue_type?: string
          last_message_at?: string | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "customer_support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_visits: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          notes: string | null
          products_purchased: string[] | null
          satisfaction_rating: number | null
          services_provided: string[] | null
          staff_member: string | null
          total_spent: number | null
          updated_at: string
          visit_date: string
          visit_duration: number | null
          visit_type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
          products_purchased?: string[] | null
          satisfaction_rating?: number | null
          services_provided?: string[] | null
          staff_member?: string | null
          total_spent?: number | null
          updated_at?: string
          visit_date?: string
          visit_duration?: number | null
          visit_type?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
          products_purchased?: string[] | null
          satisfaction_rating?: number | null
          services_provided?: string[] | null
          staff_member?: string | null
          total_spent?: number | null
          updated_at?: string
          visit_date?: string
          visit_duration?: number | null
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_visits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          business_id: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          id_document_path: string | null
          id_document_type: string | null
          last_name: string | null
          last_visit_date: string | null
          loyalty_points: number | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          signature_path: string | null
          skin_concerns: string[] | null
          skin_type: string | null
          state_province: string | null
          total_spent: number | null
          updated_at: string
          verification_date: string | null
          verified_by: string | null
          visit_count: number | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          business_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_document_path?: string | null
          id_document_type?: string | null
          last_name?: string | null
          last_visit_date?: string | null
          loyalty_points?: number | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          signature_path?: string | null
          skin_concerns?: string[] | null
          skin_type?: string | null
          state_province?: string | null
          total_spent?: number | null
          updated_at?: string
          verification_date?: string | null
          verified_by?: string | null
          visit_count?: number | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          business_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_document_path?: string | null
          id_document_type?: string | null
          last_name?: string | null
          last_visit_date?: string | null
          loyalty_points?: number | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          signature_path?: string | null
          skin_concerns?: string[] | null
          skin_type?: string | null
          state_province?: string | null
          total_spent?: number | null
          updated_at?: string
          verification_date?: string | null
          verified_by?: string | null
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_migration_jobs: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          error_records: number | null
          errors: Json | null
          file_path: string | null
          id: string
          job_type: string
          mapping_config: Json | null
          processed_records: number | null
          source_system: string
          started_at: string | null
          status: string
          total_records: number | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_records?: number | null
          errors?: Json | null
          file_path?: string | null
          id?: string
          job_type: string
          mapping_config?: Json | null
          processed_records?: number | null
          source_system: string
          started_at?: string | null
          status?: string
          total_records?: number | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_records?: number | null
          errors?: Json | null
          file_path?: string | null
          id?: string
          job_type?: string
          mapping_config?: Json | null
          processed_records?: number | null
          source_system?: string
          started_at?: string | null
          status?: string
          total_records?: number | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          business_type: string | null
          company: string
          created_at: string
          current_location_count: number | null
          current_pos_system: string | null
          demo_completed_at: string | null
          email: string
          follow_up_notes: string | null
          id: string
          name: string
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          sales_rep_assigned: string | null
          scheduled_at: string | null
          specific_requirements: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          company: string
          created_at?: string
          current_location_count?: number | null
          current_pos_system?: string | null
          demo_completed_at?: string | null
          email: string
          follow_up_notes?: string | null
          id?: string
          name: string
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          sales_rep_assigned?: string | null
          scheduled_at?: string | null
          specific_requirements?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          company?: string
          created_at?: string
          current_location_count?: number | null
          current_pos_system?: string | null
          demo_completed_at?: string | null
          email?: string
          follow_up_notes?: string | null
          id?: string
          name?: string
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          sales_rep_assigned?: string | null
          scheduled_at?: string | null
          specific_requirements?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_applications: {
        Row: {
          applied_by: string
          coupon_code_id: string | null
          created_at: string
          discount_amount: number
          discount_id: string | null
          id: string
          manager_override: boolean | null
          manager_override_reason: string | null
          order_id: string
        }
        Insert: {
          applied_by: string
          coupon_code_id?: string | null
          created_at?: string
          discount_amount: number
          discount_id?: string | null
          id?: string
          manager_override?: boolean | null
          manager_override_reason?: string | null
          order_id: string
        }
        Update: {
          applied_by?: string
          coupon_code_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_id?: string | null
          id?: string
          manager_override?: boolean | null
          manager_override_reason?: string | null
          order_id?: string
        }
        Relationships: []
      }
      discounts: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_date: string | null
          id: string
          is_stackable: boolean | null
          maximum_discount_amount: number | null
          minimum_purchase_amount: number | null
          name: string
          requires_manager_override: boolean | null
          start_date: string
          status: Database["public"]["Enums"]["discount_status"] | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_date?: string | null
          id?: string
          is_stackable?: boolean | null
          maximum_discount_amount?: number | null
          minimum_purchase_amount?: number | null
          name: string
          requires_manager_override?: boolean | null
          start_date?: string
          status?: Database["public"]["Enums"]["discount_status"] | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          end_date?: string | null
          id?: string
          is_stackable?: boolean | null
          maximum_discount_amount?: number | null
          minimum_purchase_amount?: number | null
          name?: string
          requires_manager_override?: boolean | null
          start_date?: string
          status?: Database["public"]["Enums"]["discount_status"] | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_discounts_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      document_activity: {
        Row: {
          activity_type: string
          created_at: string
          document_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          document_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          document_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_activity_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          business_id: string
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_permissions: {
        Row: {
          created_at: string
          document_id: string
          expires_at: string | null
          granted_by: string
          id: string
          permission_type: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          expires_at?: string | null
          granted_by: string
          id?: string
          permission_type: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          expires_at?: string | null
          granted_by?: string
          id?: string
          permission_type?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: string
          business_id: string
          category_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_current_version: boolean | null
          metadata: Json | null
          mime_type: string
          parent_document_id: string | null
          store_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
          version: number | null
        }
        Insert: {
          access_level?: string
          business_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_current_version?: boolean | null
          metadata?: Json | null
          mime_type: string
          parent_document_id?: string | null
          store_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
          version?: number | null
        }
        Update: {
          access_level?: string
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_current_version?: boolean | null
          metadata?: Json | null
          mime_type?: string
          parent_document_id?: string | null
          store_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_clock_status: {
        Row: {
          business_id: string
          clocked_in_at: string
          clocked_out_at: string | null
          created_at: string
          id: string
          is_active: boolean
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          clocked_in_at?: string
          clocked_out_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          clocked_in_at?: string
          clocked_out_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_clock_status_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_clock_status_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_goals: {
        Row: {
          achieved_at: string | null
          business_id: string
          commission_tier_id: string
          created_at: string
          current_value: number | null
          end_date: string
          goal_type: string
          id: string
          is_achieved: boolean | null
          start_date: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          business_id: string
          commission_tier_id: string
          created_at?: string
          current_value?: number | null
          end_date: string
          goal_type: string
          id?: string
          is_achieved?: boolean | null
          start_date: string
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          business_id?: string
          commission_tier_id?: string
          created_at?: string
          current_value?: number | null
          end_date?: string
          goal_type?: string
          id?: string
          is_achieved?: boolean | null
          start_date?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_goals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_goals_commission_tier_id_fkey"
            columns: ["commission_tier_id"]
            isOneToOne: false
            referencedRelation: "commission_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedules: {
        Row: {
          break_duration: number | null
          business_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          schedule_date: string
          start_time: string
          status: string | null
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          break_duration?: number | null
          business_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          schedule_date: string
          start_time: string
          status?: string | null
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          break_duration?: number | null
          business_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          schedule_date?: string
          start_time?: string
          status?: string | null
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      end_of_day_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          card_sales: number | null
          cash_drops: number | null
          cash_sales: number | null
          closing_cash: number | null
          created_at: string
          discounts_given: number | null
          id: string
          notes: string | null
          opening_cash: number | null
          report_date: string
          returns_amount: number | null
          status: string | null
          store_id: string
          submitted_at: string
          total_sales: number
          total_transactions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          card_sales?: number | null
          cash_drops?: number | null
          cash_sales?: number | null
          closing_cash?: number | null
          created_at?: string
          discounts_given?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number | null
          report_date: string
          returns_amount?: number | null
          status?: string | null
          store_id: string
          submitted_at?: string
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          card_sales?: number | null
          cash_drops?: number | null
          cash_sales?: number | null
          closing_cash?: number | null
          created_at?: string
          discounts_given?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number | null
          report_date?: string
          returns_amount?: number | null
          status?: string | null
          store_id?: string
          submitted_at?: string
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "end_of_day_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "end_of_day_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      external_data_staging: {
        Row: {
          created_at: string
          id: string
          mapped_data: Json | null
          migration_job_id: string
          processed_at: string | null
          raw_data: Json
          record_type: string
          source_id: string | null
          source_system: string
          status: string
          validation_errors: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          mapped_data?: Json | null
          migration_job_id: string
          processed_at?: string | null
          raw_data: Json
          record_type: string
          source_id?: string | null
          source_system: string
          status?: string
          validation_errors?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          mapped_data?: Json | null
          migration_job_id?: string
          processed_at?: string | null
          raw_data?: Json
          record_type?: string
          source_id?: string | null
          source_system?: string
          status?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "external_data_staging_migration_job_id_fkey"
            columns: ["migration_job_id"]
            isOneToOne: false
            referencedRelation: "data_migration_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          last_count_date: string | null
          low_stock_threshold: number | null
          max_stock_level: number | null
          product_id: string
          quantity_on_hand: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_count_date?: string | null
          low_stock_threshold?: number | null
          max_stock_level?: number | null
          product_id: string
          quantity_on_hand?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_count_date?: string | null
          low_stock_threshold?: number | null
          max_stock_level?: number | null
          product_id?: string
          quantity_on_hand?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          business_id: string
          created_at: string
          current_quantity: number
          id: string
          is_resolved: boolean | null
          message: string
          product_id: string
          resolved_at: string | null
          resolved_by: string | null
          store_id: string
          threshold_quantity: number | null
        }
        Insert: {
          alert_type: string
          business_id: string
          created_at?: string
          current_quantity: number
          id?: string
          is_resolved?: boolean | null
          message: string
          product_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          store_id: string
          threshold_quantity?: number | null
        }
        Update: {
          alert_type?: string
          business_id?: string
          created_at?: string
          current_quantity?: number
          id?: string
          is_resolved?: boolean | null
          message?: string
          product_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          store_id?: string
          threshold_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reorder_rules: {
        Row: {
          auto_generate_po: boolean
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          last_triggered: string | null
          preferred_supplier_id: string
          product_id: string
          reorder_point: number
          reorder_quantity: number
          store_id: string
          updated_at: string
        }
        Insert: {
          auto_generate_po?: boolean
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered?: string | null
          preferred_supplier_id: string
          product_id: string
          reorder_point?: number
          reorder_quantity?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          auto_generate_po?: boolean
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered?: string | null
          preferred_supplier_id?: string
          product_id?: string
          reorder_point?: number
          reorder_quantity?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_reorder_rules_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_reorder_rules_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_reorder_rules_store"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_reorder_rules_supplier"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_alerts: {
        Row: {
          alert_level: string | null
          created_at: string
          current_quantity: number
          id: string
          is_resolved: boolean | null
          product_id: string
          resolved_at: string | null
          store_id: string
          threshold_quantity: number
        }
        Insert: {
          alert_level?: string | null
          created_at?: string
          current_quantity: number
          id?: string
          is_resolved?: boolean | null
          product_id: string
          resolved_at?: string | null
          store_id: string
          threshold_quantity: number
        }
        Update: {
          alert_level?: string | null
          created_at?: string
          current_quantity?: number
          id?: string
          is_resolved?: boolean | null
          product_id?: string
          resolved_at?: string | null
          store_id?: string
          threshold_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "low_stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_discounts: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          discount_id: string
          earned_date: string | null
          id: string
          is_used: boolean | null
          points_required: number
          used_date: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          discount_id: string
          earned_date?: string | null
          id?: string
          is_used?: boolean | null
          points_required: number
          used_date?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          discount_id?: string
          earned_date?: string | null
          id?: string
          is_used?: boolean | null
          points_required?: number
          used_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_loyalty_discounts_business"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_loyalty_discounts_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_loyalty_discounts_discount"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          assigned_to: string | null
          business_id: string
          created_at: string
          created_by: string
          description: string | null
          equipment_name: string
          estimated_duration: number | null
          frequency_interval: number | null
          frequency_type: string
          id: string
          instructions: string | null
          is_active: boolean | null
          maintenance_type: string
          next_due_date: string
          priority: string | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          created_at?: string
          created_by: string
          description?: string | null
          equipment_name: string
          estimated_duration?: number | null
          frequency_interval?: number | null
          frequency_type: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          maintenance_type: string
          next_due_date: string
          priority?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          equipment_name?: string
          estimated_duration?: number | null
          frequency_interval?: number | null
          frequency_type?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          maintenance_type?: string
          next_due_date?: string
          priority?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      manager_approval_requests: {
        Row: {
          approval_code: string | null
          approval_method: string | null
          approved_at: string | null
          approved_by: string | null
          business_id: string
          created_at: string
          denied_at: string | null
          employee_id: string
          employee_name: string
          id: string
          items_summary: Json | null
          minimum_amount: number
          sale_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          approval_code?: string | null
          approval_method?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          created_at?: string
          denied_at?: string | null
          employee_id: string
          employee_name: string
          id?: string
          items_summary?: Json | null
          minimum_amount: number
          sale_amount: number
          status?: string
          updated_at?: string
        }
        Update: {
          approval_code?: string | null
          approval_method?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          created_at?: string
          denied_at?: string | null
          employee_id?: string
          employee_name?: string
          id?: string
          items_summary?: Json | null
          minimum_amount?: number
          sale_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          message_type: string | null
          reply_to: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          message_type?: string | null
          reply_to?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          message_type?: string | null
          reply_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          company: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          preferences: Json | null
          source: string | null
          subscribed_at: string
          subscription_type: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          company?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          preferences?: Json | null
          source?: string | null
          subscribed_at?: string
          subscription_type?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          company?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          preferences?: Json | null
          source?: string | null
          subscribed_at?: string
          subscription_type?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          business_id: string
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          shipping_required: boolean
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          shipping_required?: boolean
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          shipping_required?: boolean
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "historical_orders_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tax_details: {
        Row: {
          created_at: string
          id: string
          is_compound: boolean
          order_id: string
          tax_amount: number
          tax_name: string
          tax_rate: number
          tax_rate_id: string
          taxable_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_compound?: boolean
          order_id: string
          tax_amount: number
          tax_name: string
          tax_rate: number
          tax_rate_id: string
          taxable_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          is_compound?: boolean
          order_id?: string
          tax_amount?: number
          tax_name?: string
          tax_rate?: number
          tax_rate_id?: string
          taxable_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_tax_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "historical_orders_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tax_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tax_details_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_reference: string | null
          sale_type: string | null
          status: string | null
          store_id: string
          subtotal: number
          tax_amount: number
          tip_amount: number | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method: string
          payment_reference?: string | null
          sale_type?: string | null
          status?: string | null
          store_id: string
          subtotal?: number
          tax_amount?: number
          tip_amount?: number | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_reference?: string | null
          sale_type?: string | null
          status?: string | null
          store_id?: string
          subtotal?: number
          tax_amount?: number
          tip_amount?: number | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_security_logs: {
        Row: {
          amount: number | null
          business_id: string
          card_type: string | null
          compliance_flags: string[] | null
          created_at: string
          encryption_used: boolean | null
          event_type: string
          gateway_transaction_id: string | null
          id: string
          masked_card_number: string | null
          payment_method: string | null
          processor_response_code: string | null
          risk_assessment_score: number | null
          tokenization_used: boolean | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          business_id: string
          card_type?: string | null
          compliance_flags?: string[] | null
          created_at?: string
          encryption_used?: boolean | null
          event_type: string
          gateway_transaction_id?: string | null
          id?: string
          masked_card_number?: string | null
          payment_method?: string | null
          processor_response_code?: string | null
          risk_assessment_score?: number | null
          tokenization_used?: boolean | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          business_id?: string
          card_type?: string | null
          compliance_flags?: string[] | null
          created_at?: string
          encryption_used?: boolean | null
          event_type?: string
          gateway_transaction_id?: string | null
          id?: string
          masked_card_number?: string | null
          payment_method?: string | null
          processor_response_code?: string | null
          risk_assessment_score?: number | null
          tokenization_used?: boolean | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payroll_periods: {
        Row: {
          additions: Json | null
          base_pay: number | null
          business_id: string
          created_at: string | null
          deductions: Json | null
          employee_id: string
          generated_at: string | null
          generated_by: string
          gross_pay: number | null
          id: string
          net_pay: number | null
          period_end: string
          period_start: string
          sent_at: string | null
          status: string | null
          total_commission: number | null
          total_hours: number | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          additions?: Json | null
          base_pay?: number | null
          business_id: string
          created_at?: string | null
          deductions?: Json | null
          employee_id: string
          generated_at?: string | null
          generated_by: string
          gross_pay?: number | null
          id?: string
          net_pay?: number | null
          period_end: string
          period_start: string
          sent_at?: string | null
          status?: string | null
          total_commission?: number | null
          total_hours?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          additions?: Json | null
          base_pay?: number | null
          business_id?: string
          created_at?: string | null
          deductions?: Json | null
          employee_id?: string
          generated_at?: string | null
          generated_by?: string
          gross_pay?: number | null
          id?: string
          net_pay?: number | null
          period_end?: string
          period_start?: string
          sent_at?: string | null
          status?: string | null
          total_commission?: number | null
          total_hours?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_settings: {
        Row: {
          business_id: string
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          email_subject: string | null
          email_template: string | null
          id: string
          reply_to_email: string | null
          reply_to_name: string | null
          sender_email: string | null
          sender_name: string | null
          template_style: Json | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          email_subject?: string | null
          email_template?: string | null
          id?: string
          reply_to_email?: string | null
          reply_to_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          template_style?: Json | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          email_subject?: string | null
          email_template?: string | null
          id?: string
          reply_to_email?: string | null
          reply_to_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          template_style?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_announcements: {
        Row: {
          announcement_text: string
          approved_at: string | null
          approved_by: string | null
          business_id: string
          created_at: string
          emoji: string | null
          id: string
          order_id: string
          sale_amount: number
          salesperson_ids: string[]
          status: string | null
        }
        Insert: {
          announcement_text: string
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          created_at?: string
          emoji?: string | null
          id?: string
          order_id: string
          sale_amount: number
          salesperson_ids: string[]
          status?: string | null
        }
        Update: {
          announcement_text?: string
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          created_at?: string
          emoji?: string | null
          id?: string
          order_id?: string
          sale_amount?: number
          salesperson_ids?: string[]
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_announcements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "historical_orders_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_announcements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          measurement_period: string
          metric_name: string
          metric_type: string
          metric_value: number
          notes: string | null
          recorded_date: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          measurement_period: string
          metric_name: string
          metric_type: string
          metric_value: number
          notes?: string | null
          recorded_date: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          measurement_period?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          notes?: string | null
          recorded_date?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_review_questions: {
        Row: {
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_required: boolean | null
          options: Json | null
          question_text: string
          question_type: string
          template_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text: string
          question_type?: string
          template_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text?: string
          question_type?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_review_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_review_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_review_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_data: Json | null
          response_rating: number | null
          response_text: string | null
          review_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_data?: Json | null
          response_rating?: number | null
          response_text?: string | null
          review_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_data?: Json | null
          response_rating?: number | null
          response_text?: string | null
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_review_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "performance_review_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_review_templates: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          review_type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          review_type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          review_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          action_items: Json | null
          business_id: string
          completed_date: string | null
          created_at: string
          employee_notes: string | null
          id: string
          manager_notes: string | null
          overall_rating: number | null
          review_period_end: string
          review_period_start: string
          reviewee_id: string
          reviewer_id: string
          scheduled_date: string | null
          status: string
          template_id: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          business_id: string
          completed_date?: string | null
          created_at?: string
          employee_notes?: string | null
          id?: string
          manager_notes?: string | null
          overall_rating?: number | null
          review_period_end: string
          review_period_start: string
          reviewee_id: string
          reviewer_id: string
          scheduled_date?: string | null
          status?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          business_id?: string
          completed_date?: string | null
          created_at?: string
          employee_notes?: string | null
          id?: string
          manager_notes?: string | null
          overall_rating?: number | null
          review_period_end?: string
          review_period_start?: string
          reviewee_id?: string
          reviewer_id?: string
          scheduled_date?: string | null
          status?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_review_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          ip_address: unknown | null
          success: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_commission_rates: {
        Row: {
          business_id: string
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean | null
          max_price_range: number | null
          min_price_range: number | null
          product_category: string | null
          product_id: string | null
          role_type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          commission_rate: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_price_range?: number | null
          min_price_range?: number | null
          product_category?: string | null
          product_id?: string | null
          role_type: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_price_range?: number | null
          min_price_range?: number | null
          product_category?: string | null
          product_id?: string | null
          role_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_commission_rates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_commission_rates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          minimum_price: number | null
          name: string
          price: number
          sku: string
          track_inventory: boolean | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          minimum_price?: number | null
          name: string
          price: number
          sku: string
          track_inventory?: boolean | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          minimum_price?: number | null
          name?: string
          price?: number
          sku?: string
          track_inventory?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_preferences: Json | null
          avatar_url: string | null
          bio: string | null
          business_id: string | null
          created_at: string
          email: string | null
          first_login: boolean | null
          full_name: string | null
          hire_date: string | null
          id: string
          payroll_email: string | null
          performance_metrics: Json | null
          phone: string | null
          pos_pin: string | null
          pos_pin_hash: string | null
          position: string | null
          position_type: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          availability_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          business_id?: string | null
          created_at?: string
          email?: string | null
          first_login?: boolean | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          payroll_email?: string | null
          performance_metrics?: Json | null
          phone?: string | null
          pos_pin?: string | null
          pos_pin_hash?: string | null
          position?: string | null
          position_type?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          availability_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          business_id?: string | null
          created_at?: string
          email?: string | null
          first_login?: boolean | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          payroll_email?: string | null
          performance_metrics?: Json | null
          phone?: string | null
          pos_pin?: string | null
          pos_pin_hash?: string | null
          position?: string | null
          position_type?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity_ordered?: number
          quantity_received?: number | null
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          received_date: string | null
          status: string | null
          store_id: string
          supplier_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          received_date?: string | null
          status?: string | null
          store_id: string
          supplier_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          received_date?: string | null
          status?: string | null
          store_id?: string
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          card_sales: number | null
          cash_discrepancies: Json | null
          cash_drops: number | null
          cash_sales: number | null
          cash_variance: number | null
          closing_cash: number | null
          created_at: string
          created_by: string
          expected_cash: number | null
          id: string
          inventory_adjustments: number | null
          inventory_discrepancies: Json | null
          items_sold: number | null
          notes: string | null
          opening_cash: number | null
          report_date: string
          status: string
          store_id: string
          till_session_id: string | null
          total_sales: number | null
          total_transactions: number | null
          transaction_discrepancies: Json | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          card_sales?: number | null
          cash_discrepancies?: Json | null
          cash_drops?: number | null
          cash_sales?: number | null
          cash_variance?: number | null
          closing_cash?: number | null
          created_at?: string
          created_by: string
          expected_cash?: number | null
          id?: string
          inventory_adjustments?: number | null
          inventory_discrepancies?: Json | null
          items_sold?: number | null
          notes?: string | null
          opening_cash?: number | null
          report_date: string
          status?: string
          store_id: string
          till_session_id?: string | null
          total_sales?: number | null
          total_transactions?: number | null
          transaction_discrepancies?: Json | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          card_sales?: number | null
          cash_discrepancies?: Json | null
          cash_drops?: number | null
          cash_sales?: number | null
          cash_variance?: number | null
          closing_cash?: number | null
          created_at?: string
          created_by?: string
          expected_cash?: number | null
          id?: string
          inventory_adjustments?: number | null
          inventory_discrepancies?: Json | null
          items_sold?: number | null
          notes?: string | null
          opening_cash?: number | null
          report_date?: string
          status?: string
          store_id?: string
          till_session_id?: string | null
          total_sales?: number | null
          total_transactions?: number | null
          transaction_discrepancies?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_reports_till_session_id_fkey"
            columns: ["till_session_id"]
            isOneToOne: false
            referencedRelation: "till_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_items: {
        Row: {
          created_at: string
          id: string
          order_item_id: string
          product_id: string
          quantity_refunded: number
          refund_id: string
          total_refund_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_item_id: string
          product_id: string
          quantity_refunded?: number
          refund_id: string
          total_refund_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_item_id?: string
          product_id?: string
          quantity_refunded?: number
          refund_id?: string
          total_refund_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "refund_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_items_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          original_order_id: string
          payment_method: string
          processed_at: string | null
          reason: string | null
          refund_number: string
          refund_type: string
          status: string
          store_id: string
          total_refunded: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          original_order_id: string
          payment_method: string
          processed_at?: string | null
          reason?: string | null
          refund_number?: string
          refund_type?: string
          status?: string
          store_id: string
          total_refunded?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          original_order_id?: string
          payment_method?: string
          processed_at?: string | null
          reason?: string | null
          refund_number?: string
          refund_type?: string
          status?: string
          store_id?: string
          total_refunded?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_original_order_id_fkey"
            columns: ["original_order_id"]
            isOneToOne: false
            referencedRelation: "historical_orders_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_original_order_id_fkey"
            columns: ["original_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      review_feedback: {
        Row: {
          created_at: string
          feedback_provider_id: string
          feedback_text: string | null
          feedback_type: string
          id: string
          is_anonymous: boolean | null
          rating: number | null
          review_id: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          created_at?: string
          feedback_provider_id: string
          feedback_text?: string | null
          feedback_type: string
          id?: string
          is_anonymous?: boolean | null
          rating?: number | null
          review_id: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          created_at?: string
          feedback_provider_id?: string
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          is_anonymous?: boolean | null
          rating?: number | null
          review_id?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_feedback_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_audit: {
        Row: {
          business_id: string
          change_reason: string | null
          changed_by: string
          created_at: string
          id: string
          new_role: Database["public"]["Enums"]["user_role"]
          old_role: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Insert: {
          business_id: string
          change_reason?: string | null
          changed_by: string
          created_at?: string
          id?: string
          new_role: Database["public"]["Enums"]["user_role"]
          old_role?: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Update: {
          business_id?: string
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"]
          old_role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          access_level: string
          business_id: string
          conditions: Json | null
          created_at: string
          id: string
          permission_category: string
          permission_name: string
          role_name: string
          updated_at: string
        }
        Insert: {
          access_level: string
          business_id: string
          conditions?: Json | null
          created_at?: string
          id?: string
          permission_category: string
          permission_name: string
          role_name: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          business_id?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          permission_category?: string
          permission_name?: string
          role_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_analytics_cache: {
        Row: {
          average_order_value: number
          business_id: string
          card_sales: number | null
          cash_sales: number | null
          category_breakdown: Json | null
          cost_of_goods_sold: number | null
          created_at: string
          date_key: string
          day_of_week: number | null
          digital_wallet_sales: number | null
          gross_profit: number | null
          hour_key: number | null
          id: string
          month_key: number | null
          new_customers: number | null
          other_payment_sales: number | null
          profit_margin: number | null
          quarter_key: number | null
          returning_customers: number | null
          store_id: string | null
          total_items_sold: number
          total_sales: number
          total_transactions: number
          updated_at: string
          user_id: string | null
          week_of_year: number | null
          year_key: number | null
        }
        Insert: {
          average_order_value?: number
          business_id: string
          card_sales?: number | null
          cash_sales?: number | null
          category_breakdown?: Json | null
          cost_of_goods_sold?: number | null
          created_at?: string
          date_key: string
          day_of_week?: number | null
          digital_wallet_sales?: number | null
          gross_profit?: number | null
          hour_key?: number | null
          id?: string
          month_key?: number | null
          new_customers?: number | null
          other_payment_sales?: number | null
          profit_margin?: number | null
          quarter_key?: number | null
          returning_customers?: number | null
          store_id?: string | null
          total_items_sold?: number
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id?: string | null
          week_of_year?: number | null
          year_key?: number | null
        }
        Update: {
          average_order_value?: number
          business_id?: string
          card_sales?: number | null
          cash_sales?: number | null
          category_breakdown?: Json | null
          cost_of_goods_sold?: number | null
          created_at?: string
          date_key?: string
          day_of_week?: number | null
          digital_wallet_sales?: number | null
          gross_profit?: number | null
          hour_key?: number | null
          id?: string
          month_key?: number | null
          new_customers?: number | null
          other_payment_sales?: number | null
          profit_margin?: number | null
          quarter_key?: number | null
          returning_customers?: number | null
          store_id?: string | null
          total_items_sold?: number
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id?: string | null
          week_of_year?: number | null
          year_key?: number | null
        }
        Relationships: []
      }
      sales_goals: {
        Row: {
          business_id: string
          created_at: string
          current_count: number | null
          end_date: string
          goal_type: string
          id: string
          is_active: boolean | null
          position_type: string | null
          start_date: string
          target_amount: number
          target_count: number | null
          target_transactions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          current_count?: number | null
          end_date: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          position_type?: string | null
          start_date: string
          target_amount: number
          target_count?: number | null
          target_transactions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          current_count?: number | null
          end_date?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          position_type?: string | null
          start_date?: string
          target_amount?: number
          target_count?: number | null
          target_transactions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_goals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_training_achievements: {
        Row: {
          achievement_type: string
          business_id: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          metadata: Json | null
          module_id: string | null
          points_awarded: number | null
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          business_id: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          module_id?: string | null
          points_awarded?: number | null
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          business_id?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          module_id?: string | null
          points_awarded?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_achievements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_training_achievements_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "sales_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_training_content: {
        Row: {
          content: string
          content_type: Database["public"]["Enums"]["training_content_type"]
          created_at: string
          display_order: number | null
          embedding: string | null
          id: string
          is_active: boolean | null
          language_code: string
          metadata: Json | null
          module_id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          content_type: Database["public"]["Enums"]["training_content_type"]
          created_at?: string
          display_order?: number | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string
          metadata?: Json | null
          module_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: Database["public"]["Enums"]["training_content_type"]
          created_at?: string
          display_order?: number | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string
          metadata?: Json | null
          module_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_content_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "sales_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_training_conversations: {
        Row: {
          content: string
          id: string
          message_index: number
          metadata: Json | null
          role: string
          session_id: string
          timestamp: string
        }
        Insert: {
          content: string
          id?: string
          message_index: number
          metadata?: Json | null
          role: string
          session_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          id?: string
          message_index?: number
          metadata?: Json | null
          role?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sales_training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_training_goals: {
        Row: {
          achieved_at: string | null
          business_id: string
          created_at: string
          created_by: string
          current_value: number | null
          description: string | null
          goal_type: string
          id: string
          is_achieved: boolean | null
          target_date: string | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          business_id: string
          created_at?: string
          created_by: string
          current_value?: number | null
          description?: string | null
          goal_type: string
          id?: string
          is_achieved?: boolean | null
          target_date?: string | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          business_id?: string
          created_at?: string
          created_by?: string
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          is_achieved?: boolean | null
          target_date?: string | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_goals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_training_modules: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          description: string | null
          difficulty_level: number | null
          display_order: number | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          module_type: Database["public"]["Enums"]["training_module_type"]
          name: string
          prerequisite_modules: string[] | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          description?: string | null
          difficulty_level?: number | null
          display_order?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          module_type: Database["public"]["Enums"]["training_module_type"]
          name: string
          prerequisite_modules?: string[] | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty_level?: number | null
          display_order?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          module_type?: Database["public"]["Enums"]["training_module_type"]
          name?: string
          prerequisite_modules?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_modules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_training_progress: {
        Row: {
          average_score: number | null
          best_score: number | null
          business_id: string
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          last_accessed_at: string | null
          module_id: string
          sessions_count: number | null
          streak_days: number | null
          total_time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_score?: number | null
          best_score?: number | null
          business_id: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          module_id: string
          sessions_count?: number | null
          streak_days?: number | null
          total_time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_score?: number | null
          best_score?: number | null
          business_id?: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          module_id?: string
          sessions_count?: number | null
          streak_days?: number | null
          total_time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "sales_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_training_sessions: {
        Row: {
          ai_interactions_count: number | null
          business_id: string
          completed_at: string | null
          feedback_given: string | null
          id: string
          module_id: string
          notes: string | null
          performance_score: number | null
          session_data: Json | null
          session_status:
            | Database["public"]["Enums"]["training_session_status"]
            | null
          started_at: string
          total_duration_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_interactions_count?: number | null
          business_id: string
          completed_at?: string | null
          feedback_given?: string | null
          id?: string
          module_id: string
          notes?: string | null
          performance_score?: number | null
          session_data?: Json | null
          session_status?:
            | Database["public"]["Enums"]["training_session_status"]
            | null
          started_at?: string
          total_duration_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_interactions_count?: number | null
          business_id?: string
          completed_at?: string | null
          feedback_given?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          performance_score?: number | null
          session_data?: Json | null
          session_status?:
            | Database["public"]["Enums"]["training_session_status"]
            | null
          started_at?: string
          total_duration_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_training_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_training_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "sales_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_assignments: {
        Row: {
          business_id: string
          created_at: string
          id: string
          schedule_data: Json
          status: string
          store_id: string | null
          submitted_at: string | null
          submitted_by: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          schedule_data: Json
          status?: string
          store_id?: string | null
          submitted_at?: string | null
          submitted_by: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          schedule_data?: Json
          status?: string
          store_id?: string | null
          submitted_at?: string | null
          submitted_by?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_notifications: {
        Row: {
          business_id: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          schedule_assignment_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          schedule_assignment_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          schedule_assignment_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_notifications_schedule_assignment_id_fkey"
            columns: ["schedule_assignment_id"]
            isOneToOne: false
            referencedRelation: "schedule_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_recommendations: {
        Row: {
          business_id: string
          confidence_score: number | null
          created_at: string
          factors_considered: string[] | null
          id: string
          performance_prediction: Json | null
          recommended_pairs: Json
          schedule_date: string
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          created_at?: string
          factors_considered?: string[] | null
          id?: string
          performance_prediction?: Json | null
          recommended_pairs: Json
          schedule_date: string
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          factors_considered?: string[] | null
          id?: string
          performance_prediction?: Json | null
          recommended_pairs?: Json
          schedule_date?: string
        }
        Relationships: []
      }
      scheduled_shifts: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          notes: string | null
          position_type: string
          shift_date: string
          start_time: string
          status: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          notes?: string | null
          position_type: string
          shift_date: string
          start_time: string
          status?: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          position_type?: string
          shift_date?: string
          start_time?: string
          status?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_shifts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action_performed: string
          business_id: string
          created_at: string
          error_details: string | null
          event_category: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          outcome: string
          pci_relevant: boolean | null
          resource_accessed: string | null
          risk_score: number | null
          session_id: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_performed: string
          business_id: string
          created_at?: string
          error_details?: string | null
          event_category: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          outcome: string
          pci_relevant?: boolean | null
          resource_accessed?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_performed?: string
          business_id?: string
          created_at?: string
          error_details?: string | null
          event_category?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          outcome?: string
          pci_relevant?: boolean | null
          resource_accessed?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          additional_data: Json | null
          business_id: string | null
          created_at: string
          event_description: string
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          business_id?: string | null
          created_at?: string
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          business_id?: string | null
          created_at?: string
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          allowed_countries: string[] | null
          allowed_ip_ranges: string[] | null
          automatic_data_purging: boolean | null
          backup_encryption: boolean | null
          business_id: string
          card_data_retention_days: number | null
          created_at: string
          data_access_logging: boolean | null
          data_masking_enabled: boolean | null
          encryption_at_rest: boolean | null
          encryption_in_transit: boolean | null
          enhanced_audit_logging: boolean | null
          geo_restrictions_enabled: boolean | null
          id: string
          ip_whitelist_enabled: boolean | null
          lockout_duration_minutes: number | null
          max_login_attempts: number | null
          password_complexity_enabled: boolean | null
          password_min_length: number | null
          pci_compliance_enabled: boolean | null
          real_time_monitoring: boolean | null
          require_2fa: boolean | null
          require_2fa_for_sensitive_ops: boolean | null
          session_timeout_minutes: number | null
          suspicious_activity_alerts: boolean | null
          updated_at: string
        }
        Insert: {
          allowed_countries?: string[] | null
          allowed_ip_ranges?: string[] | null
          automatic_data_purging?: boolean | null
          backup_encryption?: boolean | null
          business_id: string
          card_data_retention_days?: number | null
          created_at?: string
          data_access_logging?: boolean | null
          data_masking_enabled?: boolean | null
          encryption_at_rest?: boolean | null
          encryption_in_transit?: boolean | null
          enhanced_audit_logging?: boolean | null
          geo_restrictions_enabled?: boolean | null
          id?: string
          ip_whitelist_enabled?: boolean | null
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          password_complexity_enabled?: boolean | null
          password_min_length?: number | null
          pci_compliance_enabled?: boolean | null
          real_time_monitoring?: boolean | null
          require_2fa?: boolean | null
          require_2fa_for_sensitive_ops?: boolean | null
          session_timeout_minutes?: number | null
          suspicious_activity_alerts?: boolean | null
          updated_at?: string
        }
        Update: {
          allowed_countries?: string[] | null
          allowed_ip_ranges?: string[] | null
          automatic_data_purging?: boolean | null
          backup_encryption?: boolean | null
          business_id?: string
          card_data_retention_days?: number | null
          created_at?: string
          data_access_logging?: boolean | null
          data_masking_enabled?: boolean | null
          encryption_at_rest?: boolean | null
          encryption_in_transit?: boolean | null
          enhanced_audit_logging?: boolean | null
          geo_restrictions_enabled?: boolean | null
          id?: string
          ip_whitelist_enabled?: boolean | null
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          password_complexity_enabled?: boolean | null
          password_min_length?: number | null
          pci_compliance_enabled?: boolean | null
          real_time_monitoring?: boolean | null
          require_2fa?: boolean | null
          require_2fa_for_sensitive_ops?: boolean | null
          session_timeout_minutes?: number | null
          suspicious_activity_alerts?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      sensitive_data_access_logs: {
        Row: {
          access_type: string
          api_endpoint: string | null
          business_id: string
          created_at: string
          fields_accessed: string[] | null
          id: string
          ip_address: unknown | null
          purpose: string | null
          record_id: string | null
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          api_endpoint?: string | null
          business_id: string
          created_at?: string
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown | null
          purpose?: string | null
          record_id?: string | null
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          api_endpoint?: string | null
          business_id?: string
          created_at?: string
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown | null
          purpose?: string | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          service_id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          service_id: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          category: string | null
          color: string | null
          created_at: string
          deposit_amount: number | null
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          requires_deposit: boolean | null
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          color?: string | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          duration: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          requires_deposit?: boolean | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          color?: string | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          requires_deposit?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          break_duration: number | null
          business_id: string
          created_at: string
          created_by: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          required_openers: number | null
          required_upsellers: number | null
          start_time: string
          store_id: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          break_duration?: number | null
          business_id: string
          created_at?: string
          created_by: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          required_openers?: number | null
          required_upsellers?: number | null
          start_time: string
          store_id?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          break_duration?: number | null
          business_id?: string
          created_at?: string
          created_by?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          required_openers?: number | null
          required_upsellers?: number | null
          start_time?: string
          store_id?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipping_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          shipping_request_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          shipping_request_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          shipping_request_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_documents_shipping_request_id_fkey"
            columns: ["shipping_request_id"]
            isOneToOne: false
            referencedRelation: "shipping_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_request_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          product_name: string
          quantity: number
          shipping_request_id: string
          sku: string | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          product_name: string
          quantity?: number
          shipping_request_id: string
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          product_name?: string
          quantity?: number
          shipping_request_id?: string
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_request_items_shipping_request_id_fkey"
            columns: ["shipping_request_id"]
            isOneToOne: false
            referencedRelation: "shipping_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_requests: {
        Row: {
          business_id: string
          carrier: string | null
          city: string
          country: string
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          employee_id: string
          estimated_value: number | null
          id: string
          items_description: string
          notes: string | null
          order_reference: string | null
          priority: string
          processed_at: string | null
          processed_by: string | null
          receipt_urls: string[] | null
          shipped_at: string | null
          shipping_address: string
          shipping_cost: number | null
          shipping_method: string | null
          special_instructions: string | null
          state: string
          status: string
          tracking_number: string | null
          updated_at: string
          zip_code: string
        }
        Insert: {
          business_id: string
          carrier?: string | null
          city: string
          country?: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          employee_id: string
          estimated_value?: number | null
          id?: string
          items_description: string
          notes?: string | null
          order_reference?: string | null
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          receipt_urls?: string[] | null
          shipped_at?: string | null
          shipping_address: string
          shipping_cost?: number | null
          shipping_method?: string | null
          special_instructions?: string | null
          state: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          zip_code: string
        }
        Update: {
          business_id?: string
          carrier?: string | null
          city?: string
          country?: string
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          employee_id?: string
          estimated_value?: number | null
          id?: string
          items_description?: string
          notes?: string | null
          order_reference?: string | null
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          receipt_urls?: string[] | null
          shipped_at?: string | null
          shipping_address?: string
          shipping_cost?: number | null
          shipping_method?: string | null
          special_instructions?: string | null
          state?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      split_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_method: string
          payment_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          payment_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          payment_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "historical_orders_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_day_sessions: {
        Row: {
          business_id: string
          closed_at: string | null
          closed_by: string | null
          closing_cash_amount: number | null
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          opened_at: string
          opened_by: string
          opening_cash_amount: number | null
          session_date: string
          store_id: string
          total_sales: number | null
          total_transactions: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_cash_amount?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_cash_amount?: number | null
          session_date?: string
          store_id: string
          total_sales?: number | null
          total_transactions?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_cash_amount?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_cash_amount?: number | null
          session_date?: string
          store_id?: string
          total_sales?: number | null
          total_transactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_day_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_day_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          business_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          pos_access_code: string | null
          status: string | null
          tax_rate: number | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          pos_access_code?: string | null
          status?: string | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          pos_access_code?: string | null
          status?: string | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: []
      }
      support_knowledge_base: {
        Row: {
          category: string
          created_at: string
          helpful_votes: number | null
          id: string
          is_active: boolean | null
          issue_type: string
          keywords: string[] | null
          not_helpful_votes: number | null
          priority: number | null
          problem_description: string
          related_features: string[] | null
          solution_steps: string[]
          subcategory: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          is_active?: boolean | null
          issue_type: string
          keywords?: string[] | null
          not_helpful_votes?: number | null
          priority?: number | null
          problem_description: string
          related_features?: string[] | null
          solution_steps: string[]
          subcategory?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          is_active?: boolean | null
          issue_type?: string
          keywords?: string[] | null
          not_helpful_votes?: number | null
          priority?: number | null
          problem_description?: string
          related_features?: string[] | null
          solution_steps?: string[]
          subcategory?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          ai_diagnosis: Json | null
          assigned_to: string | null
          category: string | null
          created_at: string
          error_data: Json
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
          user_message: string | null
        }
        Insert: {
          ai_diagnosis?: Json | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          error_data: Json
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_message?: string | null
        }
        Update: {
          ai_diagnosis?: Json | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          error_data?: Json
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_message?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          ai_category_suggestion: string | null
          ai_priority_suggestion: string | null
          ai_suggested_responses: Json | null
          assigned_to: string | null
          business_id: string
          category: string | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_category_suggestion?: string | null
          ai_priority_suggestion?: string | null
          ai_suggested_responses?: Json | null
          assigned_to?: string | null
          business_id: string
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_number?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_category_suggestion?: string | null
          ai_priority_suggestion?: string | null
          ai_suggested_responses?: Json | null
          assigned_to?: string | null
          business_id?: string
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "customer_service_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_logs: {
        Row: {
          component: string
          created_at: string
          health_score: number
          id: string
          issues: Json | null
          metrics: Json
          recommendations: Json | null
        }
        Insert: {
          component: string
          created_at?: string
          health_score: number
          id?: string
          issues?: Json | null
          metrics: Json
          recommendations?: Json | null
        }
        Update: {
          component?: string
          created_at?: string
          health_score?: number
          id?: string
          issues?: Json | null
          metrics?: Json
          recommendations?: Json | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          business_id: string
          created_at: string
          due_date: string | null
          due_time: string | null
          id: string
          notes: string | null
          priority: string | null
          recurring_days: number[] | null
          recurring_type: string | null
          status: string
          store_id: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          business_id: string
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          recurring_days?: number[] | null
          recurring_type?: string | null
          status?: string
          store_id?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          business_id?: string
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          recurring_days?: number[] | null
          recurring_type?: string | null
          status?: string
          store_id?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          assignment_id: string | null
          business_id: string
          checklist_id: string | null
          checklist_item_id: string | null
          completed_at: string
          completed_by: string
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          photo_url: string | null
          quality_score: number | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assignment_id?: string | null
          business_id: string
          checklist_id?: string | null
          checklist_item_id?: string | null
          completed_at?: string
          completed_by: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          quality_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assignment_id?: string | null
          business_id?: string
          checklist_id?: string | null
          checklist_item_id?: string | null
          completed_at?: string
          completed_by?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          quality_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "task_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          description: string | null
          estimated_duration: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          priority: string | null
          required_roles: string[] | null
          task_type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          priority?: string | null
          required_roles?: string[] | null
          task_type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          priority?: string | null
          required_roles?: string[] | null
          task_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tax_exemptions: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          entity_id: string
          exemption_reason: string | null
          exemption_type: string
          id: string
          is_active: boolean
          tax_rate_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          entity_id: string
          exemption_reason?: string | null
          exemption_type: string
          id?: string
          is_active?: boolean
          tax_rate_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          exemption_reason?: string | null
          exemption_type?: string
          id?: string
          is_active?: boolean
          tax_rate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_exemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_exemptions_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          is_compound: boolean
          name: string
          rate: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_compound?: boolean
          name: string
          rate: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_compound?: boolean
          name?: string
          rate?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      team_compatibility: {
        Row: {
          average_sales_together: number | null
          business_id: string
          compatibility_score: number | null
          created_at: string
          id: string
          notes: string | null
          successful_shifts: number | null
          total_shifts_together: number | null
          updated_at: string
          user_1_id: string
          user_2_id: string
        }
        Insert: {
          average_sales_together?: number | null
          business_id: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          successful_shifts?: number | null
          total_shifts_together?: number | null
          updated_at?: string
          user_1_id: string
          user_2_id: string
        }
        Update: {
          average_sales_together?: number | null
          business_id?: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          successful_shifts?: number | null
          total_shifts_together?: number | null
          updated_at?: string
          user_1_id?: string
          user_2_id?: string
        }
        Relationships: []
      }
      till_sessions: {
        Row: {
          business_id: string
          cash_variance: number | null
          closing_cash: number | null
          created_at: string
          expected_cash: number | null
          id: string
          notes: string | null
          opening_cash: number
          session_end: string | null
          session_start: string
          status: string
          store_id: string
          total_card_sales: number | null
          total_cash_drops: number | null
          total_cash_sales: number | null
          total_sales: number | null
          total_transactions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          cash_variance?: number | null
          closing_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number
          session_end?: string | null
          session_start?: string
          status?: string
          store_id: string
          total_card_sales?: number | null
          total_cash_drops?: number | null
          total_cash_sales?: number | null
          total_sales?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          cash_variance?: number | null
          closing_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number
          session_end?: string | null
          session_start?: string
          status?: string
          store_id?: string
          total_card_sales?: number | null
          total_cash_drops?: number | null
          total_cash_sales?: number | null
          total_sales?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "till_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "till_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      time_punches: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          created_at: string
          id: string
          ip_address: string | null
          is_manual: boolean | null
          location_lat: number | null
          location_lng: number | null
          manual_reason: string | null
          notes: string | null
          punch_time: string
          punch_type: string
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_manual?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          manual_reason?: string | null
          notes?: string | null
          punch_time?: string
          punch_type: string
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_manual?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          manual_reason?: string | null
          notes?: string | null
          punch_time?: string
          punch_type?: string
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_punches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_punches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_hours: number | null
          business_id: string
          created_at: string
          id: string
          overtime_hours: number | null
          pay_rate: number | null
          period_end: string
          period_start: string
          regular_hours: number | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          total_hours: number | null
          total_pay: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_hours?: number | null
          business_id: string
          created_at?: string
          id?: string
          overtime_hours?: number | null
          pay_rate?: number | null
          period_end: string
          period_start: string
          regular_hours?: number | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          total_hours?: number | null
          total_pay?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_hours?: number | null
          business_id?: string
          created_at?: string
          id?: string
          overtime_hours?: number | null
          pay_rate?: number | null
          period_end?: string
          period_start?: string
          regular_hours?: number | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          total_hours?: number | null
          total_pay?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_business_memberships: {
        Row: {
          base_commission_rate: number | null
          business_id: string
          commission_type: string | null
          created_at: string
          current_commission_tier: number | null
          hired_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          base_commission_rate?: number | null
          business_id: string
          commission_type?: string | null
          created_at?: string
          current_commission_tier?: number | null
          hired_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          base_commission_rate?: number | null
          business_id?: string
          commission_type?: string | null
          created_at?: string
          current_commission_tier?: number | null
          hired_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          business_id: string
          current_page: string | null
          id: string
          last_seen: string | null
          metadata: Json | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          current_page?: string | null
          id?: string
          last_seen?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          current_page?: string | null
          id?: string
          last_seen?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_security_profiles: {
        Row: {
          backup_codes: string[] | null
          business_id: string
          concurrent_sessions_allowed: number | null
          created_at: string
          failed_login_attempts: number | null
          id: string
          last_login_at: string | null
          last_login_ip: unknown | null
          last_password_change: string | null
          locked_until: string | null
          password_never_expires: boolean | null
          risk_score: number | null
          security_clearance_level: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          business_id: string
          concurrent_sessions_allowed?: number | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: unknown | null
          last_password_change?: string | null
          locked_until?: string | null
          password_never_expires?: boolean | null
          risk_score?: number | null
          security_clearance_level?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          business_id?: string
          concurrent_sessions_allowed?: number | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: unknown | null
          last_password_change?: string | null
          locked_until?: string | null
          password_never_expires?: boolean | null
          risk_score?: number | null
          security_clearance_level?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_shifts: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          business_id: string
          created_at: string
          early_departure_minutes: number | null
          id: string
          late_minutes: number | null
          notes: string | null
          scheduled_end: string
          scheduled_start: string
          status: string | null
          store_id: string | null
          total_hours_worked: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          business_id: string
          created_at?: string
          early_departure_minutes?: number | null
          id?: string
          late_minutes?: number | null
          notes?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string | null
          store_id?: string | null
          total_hours_worked?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          business_id?: string
          created_at?: string
          early_departure_minutes?: number | null
          id?: string
          late_minutes?: number | null
          notes?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string | null
          store_id?: string | null
          total_hours_worked?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      historical_orders_view: {
        Row: {
          business_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          discount_amount: number | null
          employee_name: string | null
          id: string | null
          order_number: string | null
          payment_method: string | null
          status: string | null
          store_id: string | null
          store_name: string | null
          subtotal: number | null
          tax_amount: number | null
          tip_amount: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_by_type: {
        Row: {
          full_name: string | null
          month_start: string | null
          position_type: string | null
          sale_type: string | null
          total_amount: number | null
          total_sales: number | null
          user_id: string | null
          week_start: string | null
        }
        Relationships: []
      }
      transaction_history: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_id: string | null
          id: string | null
          payment_method: string | null
          status: string | null
          store_id: string | null
          transaction_number: string | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_payroll_data: {
        Args: {
          p_employee_id: string
          p_business_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_sales: number
          total_commission: number
          total_hours: number
          daily_breakdown: Json
        }[]
      }
      calculate_team_compatibility: {
        Args: {
          p_business_id: string
          p_user_1_id: string
          p_user_2_id: string
        }
        Returns: number
      }
      check_pin_rate_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_username_availability: {
        Args: { check_username: string }
        Returns: boolean
      }
      close_store_day_session: {
        Args: {
          p_store_id: string
          p_closed_by: string
          p_closing_cash_amount: number
          p_notes?: string
        }
        Returns: boolean
      }
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_store_access_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_or_create_store_day_session: {
        Args: {
          p_store_id: string
          p_opened_by: string
          p_opening_cash_amount?: number
        }
        Returns: {
          session_id: string
          session_date: string
          opened_at: string
          opened_by_name: string
          is_new_session: boolean
        }[]
      }
      get_user_business_context: {
        Args: Record<PropertyKey, never> | { user_uuid: string }
        Returns: {
          business_id: string
          business_name: string
          user_role: Database["public"]["Enums"]["user_role"]
          store_ids: string[]
        }[]
      }
      get_user_business_context_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          business_id: string
          business_name: string
          user_role: Database["public"]["Enums"]["user_role"]
          store_ids: string[]
        }[]
      }
      get_user_business_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_business_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_commission_rate: {
        Args: { p_user_id: string; p_sales_amount: number; p_period?: string }
        Returns: number
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_any_role: {
        Args: { check_roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      has_role: {
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_activity: {
        Args: {
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_old_values?: Json
          p_new_values?: Json
          p_changes_summary?: string
          p_business_id?: string
        }
        Returns: string
      }
      log_pin_attempt: {
        Args: {
          p_user_id: string
          p_success: boolean
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_business_id: string
          p_user_id?: string
          p_event_type?: string
          p_event_category?: string
          p_action_performed?: string
          p_outcome?: string
          p_severity?: string
          p_resource_accessed?: string
          p_metadata?: Json
          p_pci_relevant?: boolean
        }
        Returns: string
      }
      map_external_data: {
        Args: {
          p_raw_data: Json
          p_source_system: string
          p_record_type: string
        }
        Returns: Json
      }
      search_knowledge_base: {
        Args: { search_query: string }
        Returns: {
          category: string
          created_at: string
          helpful_votes: number | null
          id: string
          is_active: boolean | null
          issue_type: string
          keywords: string[] | null
          not_helpful_votes: number | null
          priority: number | null
          problem_description: string
          related_features: string[] | null
          solution_steps: string[]
          subcategory: string | null
          title: string
          updated_at: string
          view_count: number | null
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      user_can_access_business: {
        Args: {
          check_business_id: string
          required_roles?: Database["public"]["Enums"]["user_role"][]
        }
        Returns: boolean
      }
      user_has_business_role: {
        Args: { check_roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      user_has_business_role_safe: {
        Args: {
          check_business_id: string
          required_roles: Database["public"]["Enums"]["user_role"][]
        }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      discount_status: "active" | "inactive" | "expired"
      discount_type: "percentage" | "fixed_amount"
      training_content_type:
        | "book_chapter"
        | "scenario"
        | "script"
        | "roleplay"
        | "quiz"
        | "video"
        | "audio"
      training_module_type:
        | "mindset"
        | "finding_why"
        | "sample_approach"
        | "connection_building"
        | "objection_handling"
        | "closing_techniques"
        | "opener_to_upseller"
        | "high_pressure_tactics"
        | "product_knowledge"
        | "customer_psychology"
      training_session_status:
        | "in_progress"
        | "completed"
        | "paused"
        | "abandoned"
      user_role:
        | "business_owner"
        | "manager"
        | "salesperson"
        | "employee"
        | "office"
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
      discount_status: ["active", "inactive", "expired"],
      discount_type: ["percentage", "fixed_amount"],
      training_content_type: [
        "book_chapter",
        "scenario",
        "script",
        "roleplay",
        "quiz",
        "video",
        "audio",
      ],
      training_module_type: [
        "mindset",
        "finding_why",
        "sample_approach",
        "connection_building",
        "objection_handling",
        "closing_techniques",
        "opener_to_upseller",
        "high_pressure_tactics",
        "product_knowledge",
        "customer_psychology",
      ],
      training_session_status: [
        "in_progress",
        "completed",
        "paused",
        "abandoned",
      ],
      user_role: [
        "business_owner",
        "manager",
        "salesperson",
        "employee",
        "office",
      ],
    },
  },
} as const
