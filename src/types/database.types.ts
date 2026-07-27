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
      agendamento: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_hora: string
          id: string
          observacoes: string | null
          profissional_id: string
          salao_id: string
          servico_id: string
          status: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_hora: string
          id?: string
          observacoes?: string | null
          profissional_id: string
          salao_id: string
          servico_id: string
          status?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_hora?: string
          id?: string
          observacoes?: string | null
          profissional_id?: string
          salao_id?: string
          servico_id?: string
          status?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "salao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servico"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamento_servico: {
        Row: {
          agendamento_id: string
          comissao_percentual: number | null
          comissao_valor: number | null
          created_at: string | null
          duracao_minutos: number
          id: string
          profissional_id: string
          servico_id: string
          valor: number
        }
        Insert: {
          agendamento_id: string
          comissao_percentual?: number | null
          comissao_valor?: number | null
          created_at?: string | null
          duracao_minutos?: number
          id?: string
          profissional_id: string
          servico_id: string
          valor?: number
        }
        Update: {
          agendamento_id?: string
          comissao_percentual?: number | null
          comissao_valor?: number | null
          created_at?: string | null
          duracao_minutos?: number
          id?: string
          profissional_id?: string
          servico_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_servico_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_servico_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_servico_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servico"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueio_agenda: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          horario_fim: string
          horario_inicio: string
          id: string
          motivo: string | null
          profissional_id: string
          salao_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          horario_fim: string
          horario_inicio: string
          id?: string
          motivo?: string | null
          profissional_id: string
          salao_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          motivo?: string | null
          profissional_id?: string
          salao_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueio_agenda_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueio_agenda_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "salao"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa_diario: {
        Row: {
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          id: string
          observacoes: string | null
          salao_id: string
          status: string
          updated_at: string
          usuario_abertura_id: string
          usuario_fechamento_id: string | null
          valor_fechamento_informado: number | null
          valor_fechamento_sistema: number | null
          valor_inicial: number
        }
        Insert: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          salao_id: string
          status?: string
          updated_at?: string
          usuario_abertura_id: string
          usuario_fechamento_id?: string | null
          valor_fechamento_informado?: number | null
          valor_fechamento_sistema?: number | null
          valor_inicial?: number
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          salao_id?: string
          status?: string
          updated_at?: string
          usuario_abertura_id?: string
          usuario_fechamento_id?: string | null
          valor_fechamento_informado?: number | null
          valor_fechamento_sistema?: number | null
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_diario_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "salao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_usuario_abertura_id_fkey"
            columns: ["usuario_abertura_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_usuario_fechamento_id_fkey"
            columns: ["usuario_fechamento_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          salao_id: string
          telefone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          salao_id: string
          telefone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          salao_id?: string
          telefone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "salao"
            referencedColumns: ["id"]
          },
        ]
      }
      salao: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          configuracoes: Json | null
          cor_primaria: string | null
          created_at: string | null
          email_dono: string | null
          endereco: string | null
          estado: string | null
          id: string
          logo_url: string | null
          logradouro: string | null
          nome: string
          numero: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          configuracoes?: Json | null
          cor_primaria?: string | null
          created_at?: string | null
          email_dono?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          logradouro?: string | null
          nome: string
          numero?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          configuracoes?: Json | null
          cor_primaria?: string | null
          created_at?: string | null
          email_dono?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          logradouro?: string | null
          nome?: string
          numero?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      servico: {
        Row: {
          ativo: boolean | null
          comissao_percentual: number | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number
          id: string
          nome: string
          salao_id: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          comissao_percentual?: number | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos: number
          id?: string
          nome: string
          salao_id: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          comissao_percentual?: number | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number
          id?: string
          nome?: string
          salao_id?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "servico_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "salao"
            referencedColumns: ["id"]
          },
        ]
      }
      transacao_caixa: {
        Row: {
          agendamento_id: string | null
          caixa_id: string | null
          categoria: string | null
          comissao_valor: number | null
          created_at: string | null
          data_hora: string | null
          descricao: string
          forma_pagamento: string
          id: string
          metadata: Json | null
          salao_id: string
          status: string
          taxa_cartao: number | null
          tipo: string
          usuario_id: string
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          caixa_id?: string | null
          categoria?: string | null
          comissao_valor?: number | null
          created_at?: string | null
          data_hora?: string | null
          descricao: string
          forma_pagamento: string
          id?: string
          metadata?: Json | null
          salao_id: string
          status?: string
          taxa_cartao?: number | null
          tipo: string
          usuario_id: string
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          caixa_id?: string | null
          categoria?: string | null
          comissao_valor?: number | null
          created_at?: string | null
          data_hora?: string | null
          descricao?: string
          forma_pagamento?: string
          id?: string
          metadata?: Json | null
          salao_id?: string
          status?: string
          taxa_cartao?: number | null
          tipo?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacao_caixa_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacao_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixa_diario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacao_caixa_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "salao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacao_caixa_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          ativo: boolean | null
          auth_user_id: string
          comissao_percentual: number | null
          created_at: string | null
          email: string
          id: string
          nome: string
          perfil: string
          pode_atender: boolean
          salao_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          auth_user_id: string
          comissao_percentual?: number | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          perfil: string
          pode_atender?: boolean
          salao_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          auth_user_id?: string
          comissao_percentual?: number | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          perfil?: string
          pode_atender?: boolean
          salao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: false
            referencedRelation: "salao"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_super_admin: { Args: never; Returns: boolean }
      get_meu_salao_id: { Args: never; Returns: string }
      get_my_salao_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_admin_do_mesmo_salao: {
        Args: { target_salao: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
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
