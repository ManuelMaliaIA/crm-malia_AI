export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned'
export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
export type ActivityType = 'note' | 'email' | 'call' | 'meeting' | 'task'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          created_at: string
          name: string
          domain: string | null
          industry: string | null
          size: string | null
          website: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          website?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          website?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company_id: string | null
          status: ContactStatus
          owner: string | null
          avatar_url: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          company_id?: string | null
          status?: ContactStatus
          owner?: string | null
          avatar_url?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          company_id?: string | null
          status?: ContactStatus
          owner?: string | null
          avatar_url?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contacts_company_id_fkey'
            columns: ['company_id']
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      deals: {
        Row: {
          id: string
          created_at: string
          title: string
          value: number
          stage: DealStage
          probability: number
          contact_id: string | null
          company_id: string | null
          owner: string | null
          close_date: string | null
          description: string | null
          user_id: string
          setup_fee: number
          monthly_fee: number
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          value?: number
          stage?: DealStage
          probability?: number
          setup_fee?: number
          monthly_fee?: number
          contact_id?: string | null
          company_id?: string | null
          owner?: string | null
          close_date?: string | null
          description?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          value?: number
          stage?: DealStage
          probability?: number
          setup_fee?: number
          monthly_fee?: number
          contact_id?: string | null
          company_id?: string | null
          owner?: string | null
          close_date?: string | null
          description?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          created_at: string
          type: ActivityType
          title: string
          body: string | null
          contact_id: string | null
          deal_id: string | null
          user_id: string
          due_at: string | null
          completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          type?: ActivityType
          title: string
          body?: string | null
          contact_id?: string | null
          deal_id?: string | null
          user_id: string
          due_at?: string | null
          completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          type?: ActivityType
          title?: string
          body?: string | null
          contact_id?: string | null
          deal_id?: string | null
          user_id?: string
          due_at?: string | null
          completed?: boolean
        }
        Relationships: []
      }
      prospeccion: {
        Row: {
          id: string
          created_at: string
          contact_id: string | null
          user_id: string
          tipo: string | null
          direccion: string | null
          telefono_local: string | null
          email_local: string | null
          web: string | null
          redes_sociales: string[] | null
          nombre_dueno: string | null
          telefono_dueno: string | null
          email_dueno: string | null
          score: number | null
          nivel_oportunidad: string | null
          nivel_digital: string | null
          tiene_web: boolean
          tiene_reservas: boolean
          problemas: string[] | null
          ciudad: string | null
          nicho: string | null
          fecha_prospeccion: string | null
          fuentes: Record<string, string> | null
        }
        Insert: {
          id?: string
          created_at?: string
          contact_id?: string | null
          user_id: string
          tipo?: string | null
          direccion?: string | null
          telefono_local?: string | null
          email_local?: string | null
          web?: string | null
          redes_sociales?: string[] | null
          nombre_dueno?: string | null
          telefono_dueno?: string | null
          email_dueno?: string | null
          score?: number | null
          nivel_oportunidad?: string | null
          nivel_digital?: string | null
          tiene_web?: boolean
          tiene_reservas?: boolean
          problemas?: string[] | null
          ciudad?: string | null
          nicho?: string | null
          fecha_prospeccion?: string | null
          fuentes?: Record<string, string> | null
        }
        Update: {
          id?: string
          created_at?: string
          contact_id?: string | null
          user_id?: string
          tipo?: string | null
          direccion?: string | null
          telefono_local?: string | null
          email_local?: string | null
          web?: string | null
          redes_sociales?: string[] | null
          nombre_dueno?: string | null
          telefono_dueno?: string | null
          email_dueno?: string | null
          score?: number | null
          nivel_oportunidad?: string | null
          nivel_digital?: string | null
          tiene_web?: boolean
          tiene_reservas?: boolean
          problemas?: string[] | null
          ciudad?: string | null
          nicho?: string | null
          fecha_prospeccion?: string | null
          fuentes?: Record<string, string> | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      contact_status: ContactStatus
      deal_stage: DealStage
      activity_type: ActivityType
    }
    CompositeTypes: Record<string, never>
  }
}

export type Company = Database['public']['Tables']['companies']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Prospeccion = Database['public']['Tables']['prospeccion']['Row']
