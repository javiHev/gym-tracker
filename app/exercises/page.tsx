"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { CalendarView } from "@/components/exercises/CalendarView";
import { ScheduledSession } from "@/types/routines";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Play, RotateCcw, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ExercisesPage() {
    const supabase = createClient();
    const router = useRouter();
    const [schedule, setSchedule] = useState<ScheduledSession[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("workout_sessions")
                .select("id, started_at, status, routine_day:routine_days(name)")
                .eq("user_id", user.id);

            if (data) {
                const mapped: ScheduledSession[] = data.map((s: any) => {
                    const date = new Date(s.started_at);
                    // Format YYYY-MM-DD
                    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                    return {
                        id: s.id,
                        date: dateString,
                        completed: s.status === 'completed',
                        status: s.status,
                        routineName: s.routine_day?.name || "Entrenamiento"
                    };
                });
                setSchedule(mapped);
            }
            setLoading(false);
        };

        fetchSessions();
    }, []);

    useEffect(() => {
        // Update selected session when date changes
        const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        const found = schedule.find(s => s.date === dateString);
        setSelectedSession(found || null);
    }, [selectedDate, schedule]);

    const handleResume = () => {
        if (selectedSession?.id) {
            router.push(`/workout/${selectedSession.id}`);
        }
    };

    const handleViewDetails = () => {
        if (selectedSession?.id) {
            // For now just allow resume/view same page, or could go to specific details page
            // If completed, maybe show summary? Re-using workout page for now as mapped
            // Ideally we need a Summary/Details readonly page for completed sessions.
            // For MVP, if completed, maybe we just show a toast "Sesión completada"? Or allow viewing logs.
            router.push(`/workout/${selectedSession.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-muted/10 p-6 pb-24 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Calendario de Entrenamientos</h1>
                    <p className="text-muted-foreground">Gestiona tus sesiones y progreso.</p>
                </div>
            </div>

            <CalendarView
                schedule={schedule}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar size={20} />
                    {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </h2>

                {selectedSession ? (
                    <Card className="border-l-4" style={{ borderLeftColor: selectedSession.completed ? '#10b981' : '#3b82f6' }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between items-center">
                                {selectedSession.routineName}
                                {selectedSession.completed ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Completado
                                    </span>
                                ) : (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                                        <RotateCcw size={12} /> En Progreso
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {selectedSession.status === 'abandoned' ? 'Abandonado' : (selectedSession.completed ? 'Finalizado con éxito' : 'Listo para continuar')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!selectedSession.completed && (
                                <Button className="w-full gap-2" onClick={handleResume}>
                                    <Play size={16} /> Retomar Sesión
                                </Button>
                            )}
                            {selectedSession.completed && (
                                <Button variant="outline" className="w-full gap-2" onClick={handleViewDetails}>
                                    Ver Detalles
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-muted-foreground text-center">
                            <p>No hay entrenamiento registrado para este día.</p>
                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" onClick={() => router.push('/routines')}>
                                    Ir a Rutinas
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
