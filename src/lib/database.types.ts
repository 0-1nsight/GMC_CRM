export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          unit_price: number;
          unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          unit_price?: number;
          unit?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          unit_price?: number;
          unit?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotations: {
        Row: {
          id: string;
          customer_id: string;
          quotation_number: string;
          date: string;
          valid_until: string | null;
          status: string;
          notes: string | null;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          quotation_number: string;
          date?: string;
          valid_until?: string | null;
          status?: string;
          notes?: string | null;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          quotation_number?: string;
          date?: string;
          valid_until?: string | null;
          status?: string;
          notes?: string | null;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          service_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          service_id?: string | null;
          description: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
        };
        Update: {
          id?: string;
          quotation_id?: string;
          service_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
        };
      };
      invoices: {
        Row: {
          id: string;
          customer_id: string;
          quotation_id: string | null;
          invoice_number: string;
          date: string;
          due_date: string | null;
          status: string;
          notes: string | null;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          quotation_id?: string | null;
          invoice_number: string;
          date?: string;
          due_date?: string | null;
          status?: string;
          notes?: string | null;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          quotation_id?: string | null;
          invoice_number?: string;
          date?: string;
          due_date?: string | null;
          status?: string;
          notes?: string | null;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          service_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          service_id?: string | null;
          description: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          service_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
        };
      };
    };
  };
}
