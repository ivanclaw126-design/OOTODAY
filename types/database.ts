export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
          image_flipped: boolean
          image_original_url: string | null
          image_rotation_quarter_turns: number
          image_restore_expires_at: string | null
          category: string
          sub_category: string | null
          color_category: string | null
          style_tags: string[]
          algorithm_meta: Json
          season_tags: string[]
          brand: string | null
          purchase_price: number | null
          purchase_year: string | null
          item_condition: string | null
          last_worn_date: string | null
          wear_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          category: string
          image_url?: string | null
          image_flipped?: boolean
          image_original_url?: string | null
          image_rotation_quarter_turns?: number
          image_restore_expires_at?: string | null
          sub_category?: string | null
          color_category?: string | null
          style_tags?: string[]
          algorithm_meta?: Json
          season_tags?: string[]
          brand?: string | null
          purchase_price?: number | null
          purchase_year?: string | null
          item_condition?: string | null
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
      recommendation_preferences: {
        Row: {
          user_id: string
          version: number
          source: 'default' | 'questionnaire' | 'adaptive'
          default_weights: Json
          questionnaire_delta: Json
          rating_delta: Json
          final_weights: Json
          profile: Json
          questionnaire_answers: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          version: number
          source?: 'default' | 'questionnaire' | 'adaptive'
          default_weights: Json
          questionnaire_delta?: Json
          rating_delta?: Json
          final_weights: Json
          profile: Json
          questionnaire_answers?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          version?: number
          source?: 'default' | 'questionnaire' | 'adaptive'
          default_weights?: Json
          questionnaire_delta?: Json
          rating_delta?: Json
          final_weights?: Json
          profile?: Json
          questionnaire_answers?: Json | null
          updated_at?: string
        }
      }
      outfit_feedback_events: {
        Row: {
          id: string
          user_id: string
          recommendation_id: string | null
          preference_version: number | null
          context: string
          rating: number
          reason_tags: string[]
          recommendation_snapshot: Json | null
          component_scores: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recommendation_id?: string | null
          preference_version?: number | null
          context?: string
          rating: number
          reason_tags?: string[]
          recommendation_snapshot?: Json | null
          component_scores?: Json | null
          created_at?: string
        }
        Update: {
          recommendation_id?: string | null
          preference_version?: number | null
          context?: string
          rating?: number
          reason_tags?: string[]
          recommendation_snapshot?: Json | null
          component_scores?: Json | null
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          anonymous_id: string | null
          session_id: string | null
          event_name: string
          module: string
          route: string | null
          properties: Json
          user_agent: string | null
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          anonymous_id?: string | null
          session_id?: string | null
          event_name: string
          module: string
          route?: string | null
          properties?: Json
          user_agent?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          created_at?: string
        }
        Update: {
          anonymous_id?: string | null
          session_id?: string | null
          event_name?: string
          module?: string
          route?: string | null
          properties?: Json
          user_agent?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
        }
      }
    }
  }
}
