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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bancos: {
        Row: {
          icone: string | null
          id: string
          nome: string
        }
        Insert: {
          icone?: string | null
          id?: string
          nome: string
        }
        Update: {
          icone?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          metadata?: Json | null
        }
        Relationships: []
      }
      operacoes: {
        Row: {
          banco: string
          created_at: string
          data: string
          descricao: string
          hora: string
          id: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          banco: string
          created_at?: string
          data: string
          descricao: string
          hora?: string
          id?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          banco?: string
          created_at?: string
          data?: string
          descricao?: string
          hora?: string
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      placas_solares: {
        Row: {
          aceita_financiamento: string | null
          dimensao: string | null
          eficiencia: string | null
          especs: string | null
          garantia: string | null
          id: string
          modelo: string | null
          modelo_instalacao: string | null
          pacote_10_placas: string | null
          pacote_20_placas: string | null
          pacote_5_placas: string | null
          prazo: string | null
          preco_por_placa: string | null
          quantidade: number | null
          status: string | null
        }
        Insert: {
          aceita_financiamento?: string | null
          dimensao?: string | null
          eficiencia?: string | null
          especs?: string | null
          garantia?: string | null
          id?: string
          modelo?: string | null
          modelo_instalacao?: string | null
          pacote_10_placas?: string | null
          pacote_20_placas?: string | null
          pacote_5_placas?: string | null
          prazo?: string | null
          preco_por_placa?: string | null
          quantidade?: number | null
          status?: string | null
        }
        Update: {
          aceita_financiamento?: string | null
          dimensao?: string | null
          eficiencia?: string | null
          especs?: string | null
          garantia?: string | null
          id?: string
          modelo?: string | null
          modelo_instalacao?: string | null
          pacote_10_placas?: string | null
          pacote_20_placas?: string | null
          pacote_5_placas?: string | null
          prazo?: string | null
          preco_por_placa?: string | null
          quantidade?: number | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          key: string | null
          nome: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          key?: string | null
          nome?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          key?: string | null
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cpf: string | null
          criado_em: string | null
          forma_pagamento: string | null
          id: string
          info_proposta: string | null
          motivo_rejeicao: string | null
          nome_completo: string | null
          nome_whatsapp: string | null
          numero: string
          Oportunidade: string | null
          pausar_ia: string | null
          pdf_url: string | null
          prazo_instalacao: string | null
          produto_proposta: string | null
          qualificacao: string | null
          renda: string | null
          resumo: string | null
          ultima_mensagem: string | null
          valor_proposta: string | null
        }
        Insert: {
          cpf?: string | null
          criado_em?: string | null
          forma_pagamento?: string | null
          id?: string
          info_proposta?: string | null
          motivo_rejeicao?: string | null
          nome_completo?: string | null
          nome_whatsapp?: string | null
          numero: string
          Oportunidade?: string | null
          pausar_ia?: string | null
          pdf_url?: string | null
          prazo_instalacao?: string | null
          produto_proposta?: string | null
          qualificacao?: string | null
          renda?: string | null
          resumo?: string | null
          ultima_mensagem?: string | null
          valor_proposta?: string | null
        }
        Update: {
          cpf?: string | null
          criado_em?: string | null
          forma_pagamento?: string | null
          id?: string
          info_proposta?: string | null
          motivo_rejeicao?: string | null
          nome_completo?: string | null
          nome_whatsapp?: string | null
          numero?: string
          Oportunidade?: string | null
          pausar_ia?: string | null
          pdf_url?: string | null
          prazo_instalacao?: string | null
          produto_proposta?: string | null
          qualificacao?: string | null
          renda?: string | null
          resumo?: string | null
          ultima_mensagem?: string | null
          valor_proposta?: string | null
        }
        Relationships: []
      }
      usuarios_crm: {
        Row: {
          criado_em: string | null
          email: string
          id: string
          senha: string
        }
        Insert: {
          criado_em?: string | null
          email: string
          id?: string
          senha: string
        }
        Update: {
          criado_em?: string | null
          email?: string
          id?: string
          senha?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hybrid_search: {
        Args: {
          full_text_weight?: number
          match_count: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json | null
        }[]
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      tipo_seguro:
        | "auto"
        | "fianca"
        | "saude"
        | "incendio"
        | "vida"
        | "empresarial"
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
      tipo_seguro: [
        "auto",
        "fianca",
        "saude",
        "incendio",
        "vida",
        "empresarial",
      ],
    },
  },
} as const
