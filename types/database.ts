export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      diagnostics: {
        Row: {
          id: number;
          type: string;
          description: string;
          user_id: string;
          date: string;
          status: string;
        };
        Insert: {
          id?: number;
          type: string;
          description: string;
          user_id: string;
          date: string;
          status?: string;
        };
        Update: {
          id?: number;
          type?: string;
          description?: string;
          user_id?: string;
          date?: string;
          status?: string;
        };
        Relationships: [];
      },
      profiles: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
          role: string;
          updated_at: string | null;
          username: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
          role?: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
          role?: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          details: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          details?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          details?: string | null;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      tickets: {
        Row: {
          assigned_to: string | null;
          attachment_url: string | null;
          category: string | null;
          comments: Json | null;
          created_at: string;
          description: string;
          id: string;
          solution: string | null;
          status: string;
          title: string;
          user_id: string;
          proposed_price: number | null;
          price_status: string | null;
          payment_date: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          attachment_url?: string | null;
          category?: string | null;
          comments?: Json | null;
          created_at?: string;
          description: string;
          id?: string;
          solution?: string | null;
          status?: string;
          title: string;
          user_id: string;
        };
        Update: {
          assigned_to?: string | null;
          attachment_url?: string | null;
          category?: string | null;
          comments?: Json | null;
          created_at?: string;
          description?: string;
          id?: string;
          solution?: string | null;
          status?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
