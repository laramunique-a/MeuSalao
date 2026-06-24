export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      salao: {
        Row: {
          id: string
          nome: string
          endereco: string | null
          telefone: string | null
          logo_url: string | null
          cor_primaria: string | null
          configuracoes: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          endereco?: string | null
          telefone?: string | null
          logo_url?: string | null
          cor_primaria?: string | null
          configuracoes?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string | null
          telefone?: string | null
          logo_url?: string | null
          cor_primaria?: string | null
          configuracoes?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      usuario: {
        Row: {
          id: string
          salao_id: string | null
          auth_user_id: string
          nome: string
          email: string
          perfil: 'administrador' | 'profissional' | 'super_admin'
          comissao_percentual: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          salao_id?: string | null
          auth_user_id: string
          nome: string
          email: string
          perfil?: 'administrador' | 'profissional' | 'super_admin'
          comissao_percentual?: number
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          salao_id?: string | null
          auth_user_id?: string
          nome?: string
          email?: string
          perfil?: 'administrador' | 'profissional' | 'super_admin'
          comissao_percentual?: number
          ativo?: boolean
          created_at?: string
        }
      }
      cliente: {
        Row: {
          id: string
          salao_id: string
          nome: string
          telefone: string
          email: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salao_id: string
          nome: string
          telefone: string
          email?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salao_id?: string
          nome?: string
          telefone?: string
          email?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      servico: {
        Row: {
          id: string
          salao_id: string
          nome: string
          descricao: string | null
          valor: number
          duracao_minutos: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salao_id: string
          nome: string
          descricao?: string | null
          valor: number
          duracao_minutos: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salao_id?: string
          nome?: string
          descricao?: string | null
          valor?: number
          duracao_minutos?: number
          comissao_percentual?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      agendamento: {
        Row: {
          id: string
          salao_id: string
          cliente_id: string
          profissional_id: string
          servico_id: string
          data_hora: string
          status: 'agendado' | 'confirmado' | 'em_atendimento' | 'em_atraso' | 'concluido' | 'cancelado'
          valor: number
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salao_id: string
          cliente_id: string
          profissional_id: string
          servico_id: string
          data_hora: string
          status?: 'agendado' | 'confirmado' | 'em_atendimento' | 'em_atraso' | 'concluido' | 'cancelado'
          valor: number
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salao_id?: string
          cliente_id?: string
          profissional_id?: string
          servico_id?: string
          data_hora?: string
          status?: 'agendado' | 'confirmado' | 'em_atendimento' | 'em_atraso' | 'concluido' | 'cancelado'
          valor?: number
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transacao_caixa: {
        Row: {
          id: string
          salao_id: string
          usuario_id: string
          agendamento_id: string | null
          caixa_id: string | null
          tipo: 'entrada' | 'saida'
          valor: number
          forma_pagamento: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'outros'
          categoria: string | null
          descricao: string
          status: 'ativo' | 'cancelado' | 'estornado'
          taxa_cartao: number
          comissao_valor: number
          metadata: Json
          data_hora: string
          created_at: string
        }
        Insert: {
          id?: string
          salao_id: string
          usuario_id: string
          agendamento_id?: string | null
          caixa_id?: string | null
          tipo: 'entrada' | 'saida'
          valor: number
          forma_pagamento: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'outros'
          categoria?: string | null
          descricao: string
          status?: 'ativo' | 'cancelado' | 'estornado'
          taxa_cartao?: number
          comissao_valor?: number
          metadata?: Json
          data_hora?: string
          created_at?: string
        }
        Update: {
          id?: string
          salao_id?: string
          usuario_id?: string
          agendamento_id?: string | null
          caixa_id?: string | null
          tipo?: 'entrada' | 'saida'
          valor?: number
          forma_pagamento?: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'outros'
          categoria?: string | null
          descricao?: string
          status?: 'ativo' | 'cancelado' | 'estornado'
          taxa_cartao?: number
          comissao_valor?: number
          metadata?: Json
          data_hora?: string
          created_at?: string
        }
      }
      bloqueio_agenda: {
        Row: {
          id: string
          salao_id: string
          profissional_id: string
          data_inicio: string
          data_fim: string
          horario_inicio: string
          horario_fim: string
          motivo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salao_id: string
          profissional_id: string
          data_inicio: string
          data_fim: string
          horario_inicio: string
          horario_fim: string
          motivo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salao_id?: string
          profissional_id?: string
          data_inicio?: string
          data_fim?: string
          horario_inicio?: string
          horario_fim?: string
          motivo?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
