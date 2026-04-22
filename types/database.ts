export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          city: string | null
          style_preferences: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          city?: string | null
          style_preferences?: string[]
        }
        Update: {
          city?: string | null
          style_preferences?: string[]
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          image_url: string | null
          category: string
          sub_category: string | null
          color_category: string | null
          style_tags: string[]
          season_tags: string[]
          brand: string | null
          last_worn_date: string | null
          wear_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          category: string
          image_url?: string | null
          sub_category?: string | null
          color_category?: string | null
          style_tags?: string[]
          season_tags?: string[]
          brand?: string | null
          last_worn_date?: string | null
          wear_count?: number
        }
        Update: Partial<Database['public']['Tables']['items']['Insert']> & {
          updated_at?: string
        }
      }
      outfits: {
        Row: {
          id: string
          user_id: string
          title: string
          item_ids: string[]
          scenario: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          title: string
          item_ids?: string[]
          scenario?: string | null
        }
        Update: {
          title?: string
          item_ids?: string[]
          scenario?: string | null
        }
      }
      ootd: {
        Row: {
          id: string
          user_id: string
          outfit_id: string | null
          photo_url: string | null
          satisfaction_score: number | null
          worn_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          worn_at: string
          outfit_id?: string | null
          photo_url?: string | null
          satisfaction_score?: number | null
          notes?: string | null
        }
        Update: {
          outfit_id?: string | null
          photo_url?: string | null
          satisfaction_score?: number | null
          worn_at?: string
          notes?: string | null
        }
      }
      travel_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          destination_city: string
          days: number
          scenes: string[]
          weather_summary: string | null
          plan_json: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          destination_city: string
          days: number
          scenes?: string[]
          weather_summary?: string | null
          plan_json: unknown
        }
        Update: {
          title?: string
          destination_city?: string
          days?: number
          scenes?: string[]
          weather_summary?: string | null
          plan_json?: unknown
          updated_at?: string
        }
      }
    }
  }
}
