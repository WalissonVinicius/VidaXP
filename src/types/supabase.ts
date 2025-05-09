export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          user_id: string;
          color: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          user_id: string;
          color?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          user_id?: string;
          color?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          points: number;
          category_id: string;
          completed: boolean;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          points: number;
          category_id: string;
          completed?: boolean;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          points?: number;
          category_id?: string;
          completed?: boolean;
          user_id?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          points_required: number;
          achieved: boolean;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          points_required: number;
          achieved?: boolean;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          points_required?: number;
          achieved?: boolean;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}