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
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    weight_kg: number | null
                    height_cm: number | null
                    birth_date: string | null
                    units: 'metric' | 'imperial'
                    theme: 'light' | 'dark' | 'auto'
                    notifications_enabled: boolean
                    timer_sound_enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    weight_kg?: number | null
                    height_cm?: number | null
                    birth_date?: string | null
                    units?: 'metric' | 'imperial'
                    theme?: 'light' | 'dark' | 'auto'
                    notifications_enabled?: boolean
                    timer_sound_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    weight_kg?: number | null
                    height_cm?: number | null
                    birth_date?: string | null
                    units?: 'metric' | 'imperial'
                    theme?: 'light' | 'dark' | 'auto'
                    notifications_enabled?: boolean
                    timer_sound_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            routines: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    is_active: boolean
                    is_archived: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    is_active?: boolean
                    is_archived?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    is_active?: boolean
                    is_archived?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            routine_days: {
                Row: {
                    id: string
                    routine_id: string
                    name: string
                    day_number: number
                    color: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    routine_id: string
                    name: string
                    day_number: number
                    color?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    routine_id?: string
                    name?: string
                    day_number?: number
                    color?: string | null
                    created_at?: string
                }
            }
            exercises: {
                Row: {
                    id: string
                    routine_day_id: string
                    name: string
                    base_sets: number
                    base_reps: string
                    target_weight_kg: number | null
                    target_sets: number | null
                    target_reps: string | null
                    target_rir: number | null
                    order_index: number
                    rest_seconds: number | null
                    notes: string | null
                    last_target_update: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    routine_day_id: string
                    name: string
                    base_sets: number
                    base_reps: string
                    target_weight_kg?: number | null
                    target_sets?: number | null
                    target_reps?: string | null
                    target_rir?: number | null
                    order_index: number
                    rest_seconds?: number | null
                    notes?: string | null
                    last_target_update?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    routine_day_id?: string
                    name?: string
                    base_sets?: number
                    base_reps?: string
                    target_weight_kg?: number | null
                    target_sets?: number | null
                    target_reps?: string | null
                    target_rir?: number | null
                    order_index?: number
                    rest_seconds?: number | null
                    notes?: string | null
                    last_target_update?: string | null
                    created_at?: string
                }
            }
            workout_sessions: {
                Row: {
                    id: string
                    user_id: string
                    routine_day_id: string | null
                    started_at: string
                    completed_at: string | null
                    status: 'in_progress' | 'completed' | 'abandoned'
                    duration_minutes: number | null
                    total_volume_kg: number | null
                    overall_feeling: 'excellent' | 'good' | 'normal' | 'tired' | 'poor' | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    routine_day_id?: string | null
                    started_at?: string
                    completed_at?: string | null
                    status?: 'in_progress' | 'completed' | 'abandoned'
                    duration_minutes?: number | null
                    total_volume_kg?: number | null
                    overall_feeling?: 'excellent' | 'good' | 'normal' | 'tired' | 'poor' | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    routine_day_id?: string | null
                    started_at?: string
                    completed_at?: string | null
                    status?: 'in_progress' | 'completed' | 'abandoned'
                    duration_minutes?: number | null
                    total_volume_kg?: number | null
                    overall_feeling?: 'excellent' | 'good' | 'normal' | 'tired' | 'poor' | null
                    notes?: string | null
                    created_at?: string
                }
            }
        }
    }
}
