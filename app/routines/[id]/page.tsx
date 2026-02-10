"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Routine, RoutineDay } from "@/types/routines";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Dumbbell, Play, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function RoutineDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const supabase = createClient();

    const [routine, setRoutine] = useState<Routine | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoutine = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from("routines")
                .select(`
                    *,
                    days:routine_days(
                        *,
                        exercises(*)
                    )
                `)
                .eq("id", id)
                .single();

            if (error) {
                toast.error("Error cargando rutina");
                console.error(error);
            } else {
                setRoutine(data as unknown as Routine);
            }
            setLoading(false);
        };

        fetchRoutine();
    }, [id]); // Removed supabase from dependency array to avoid loops

    const handleStartSession = async (day: RoutineDay) => {
        const toastId = toast.loading("Iniciando sesión...");
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error("No autenticado", { id: toastId });
            return;
        }

        const { data: session, error } = await supabase
            .from("workout_sessions")
            .insert({
                user_id: user.id,
                routine_day_id: day.id,
                started_at: new Date().toISOString(),
                status: 'in_progress',
                overall_feeling: 'normal'
            })
            .select() // Important to return the inserted row
            .single();

        if (error) {
            toast.error("Error al iniciar: " + error.message, { id: toastId });
        } else if (session) {
            toast.success("¡A entrenar!", { id: toastId });
            router.push(`/workout/${session.id}`);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;
    if (!routine) return <div className="p-8 text-center">Rutina no encontrada</div>;

    return (
        <div className="min-h-screen bg-muted/10 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft size={24} />
                </Button>
                <div>
                    <h1 className="text-xl font-bold truncate">{routine.name}</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">
                <div className="prose dark:prose-invert text-sm text-muted-foreground">
                    {routine.description}
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Dumbbell className="text-primary" size={20} />
                        Días de Entrenamiento
                    </h2>

                    {routine.days?.sort((a, b) => a.day_number - b.day_number).map((day) => (
                        <Card key={day.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: day.color || '#3B82F6' }}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between items-center">
                                    {day.name}
                                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        {day.exercises?.length || 0} ejercicios
                                    </span>
                                </CardTitle>
                                {day.day_number && (
                                    <CardDescription>Día {day.day_number}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    {day.exercises?.slice(0, 3).map(ex => (
                                        <div key={ex.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                            {ex.name}
                                        </div>
                                    ))}
                                    {(day.exercises?.length || 0) > 3 && (
                                        <div className="text-xs text-muted-foreground pl-3">
                                            + {(day.exercises?.length || 0) - 3} más...
                                        </div>
                                    )}
                                </div>
                                <Button className="w-full gap-2" onClick={() => handleStartSession(day)}>
                                    <Play size={16} /> Iniciar Sesión
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
