import { Database } from "./database";

export type Routine = Database["public"]["Tables"]["routines"]["Row"] & {
    days: RoutineDay[];
};

export type RoutineDay = Database["public"]["Tables"]["routine_days"]["Row"] & {
    exercises: Exercise[];
};

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export type WorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"];

export interface ScheduledSession {
    id: string;
    date: string; // YYYY-MM-DD
    completed: boolean;
    status: 'in_progress' | 'completed' | 'abandoned';
    routineName?: string;
}
