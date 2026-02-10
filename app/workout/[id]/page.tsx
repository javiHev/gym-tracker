"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveExercise } from "@/components/workout/ActiveExercise";
import { AIWorkoutAssistant } from "@/components/workout/AIWorkoutAssistant";
import { RoutineDay, Exercise, WorkoutSession } from "@/types/routines";
import { useCopilotReadable } from "@copilotkit/react-core";

export default function WorkoutSessionPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const supabase = createClient();

    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [routineDay, setRoutineDay] = useState<RoutineDay | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [logs, setLogs] = useState<any[]>([]); // All logs for this session
    const [historyLogs, setHistoryLogs] = useState<any[]>([]); // Logs from previous sessions
    const [loading, setLoading] = useState(true);

    // Fetch Session Data
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);

            // 1. Get Session
            const { data: sessionData, error: sessionError } = await supabase
                .from("workout_sessions")
                .select("*")
                .eq("id", id)
                .single();

            if (sessionError || !sessionData) {
                toast.error("Error cargando sesión");
                setLoading(false);
                return;
            }
            setSession(sessionData as WorkoutSession);

            let currentExercises: Exercise[] = [];

            if (sessionData.routine_day_id) {
                // 2. Get Routine Day & Exercises
                const { data: dayData, error: dayError } = await supabase
                    .from("routine_days")
                    .select("*, exercises(*)")
                    .eq("id", sessionData.routine_day_id)
                    .single();

                if (dayData) {
                    setRoutineDay(dayData as RoutineDay);
                    // Sort exercises by order_index
                    const sortedExercises = (dayData.exercises || []).sort((a: any, b: any) => a.order_index - b.order_index);
                    setExercises(sortedExercises as Exercise[]);
                    currentExercises = sortedExercises;
                }
            }

            // 3. Get Existing Logs (Current Session)
            const { data: logsData } = await supabase
                .from("workout_logs")
                .select("*")
                .eq("workout_session_id", id);

            if (logsData) {
                setLogs(logsData);
            }

            // 4. Get History Logs (Previous Sessions)
            if (currentExercises.length > 0) {
                const { data: historyData } = await supabase
                    .from("workout_logs")
                    .select("*, workout_sessions!inner(started_at)")
                    .in("exercise_id", currentExercises.map(e => e.id))
                    .neq("workout_session_id", id) // Exclude current session
                    .order("logged_at", { ascending: false })
                    .limit(200); // Decent limit

                if (historyData) {
                    setHistoryLogs(historyData);
                }
            }

            setLoading(false);
        };

        fetchData();
    }, [id]);

    // Copilot Context
    useCopilotReadable({
        description: "Active workout session details",
        value: {
            session,
            routineDay,
            exercises,
            currentLogs: logs,
            historyLogs
        }
    });

    const handleSetComplete = async (exerciseId: string, setNumber: number, weight: number, reps: number, rir: number) => {
        if (!session) return;

        // 1. Optimistic UI update (logs state is already updated by fetch, but we need to append strictly?)
        const newLog = {
            workout_session_id: session.id,
            exercise_id: exerciseId,
            set_number: setNumber,
            weight_kg: weight,
            reps_completed: reps,
            rir: rir,
            logged_at: new Date().toISOString()
        };

        setLogs(prev => [...prev, newLog]);

        // 2. DB Insert
        const { error } = await supabase.from("workout_logs").upsert({
            workout_session_id: session.id,
            exercise_id: exerciseId,
            set_number: setNumber,
            weight_kg: weight,
            reps_completed: reps,
            rir: rir
        }, { onConflict: 'workout_session_id, exercise_id, set_number' });

        if (error) {
            toast.error("Error guardando serie");
            console.error(error);
        } else {
            toast.success("Serie guardada");
        }
    };

    const finishWorkout = async () => {
        if (!session) return;

        await supabase
            .from("workout_sessions")
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq("id", session.id);

        toast.success("Entrenamiento finalizado!");
        router.push("/dashboard");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session || !routineDay) {
        return <div className="p-8">Sesión no encontrada</div>;
    }

    return (
        <div className="min-h-screen bg-muted/10 pb-32">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold">{routineDay.name}</h1>
                        <p className="text-xs text-muted-foreground">En progreso...</p>
                    </div>
                </div>
                <Button variant="destructive" size="sm" onClick={finishWorkout}>
                    Terminar
                </Button>
            </header>

            <main className="max-w-md mx-auto px-4 py-6">
                {exercises.map((exercise) => (
                    <ActiveExercise
                        key={exercise.id}
                        exercise={exercise}
                        logs={logs.filter(l => l.exercise_id === exercise.id)}
                        historyLogs={historyLogs.filter(l => l.exercise_id === exercise.id)}
                        onSetComplete={(setNum, w, r, rir) => handleSetComplete(exercise.id, setNum, w, r, rir)}
                    />
                ))}
            </main>

            {/* AI Assistant */}
            <div className="fixed bottom-24 right-4 z-50">
                <AIWorkoutAssistant
                    // pass useful context like last log
                    lastLog={logs.length > 0 ? {
                        weight: logs[logs.length - 1].weight_kg,
                        reps: logs[logs.length - 1].reps_completed,
                        rir: logs[logs.length - 1].rir,
                        exerciseName: "Last Exercise" // TODO: map name
                    } : undefined}
                />
            </div>
        </div>
    );
}
