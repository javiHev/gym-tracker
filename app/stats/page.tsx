"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Loader2 } from "lucide-react";

export default function StatsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [volumeData, setVolumeData] = useState<any[]>([]);
    const [strengthData, setStrengthData] = useState<any[]>([]);
    const [muscleRadarData, setMuscleRadarData] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch completed sessions
            const { data: sessions } = await supabase
                .from("workout_sessions")
                .select("*, workout_logs(*, exercises(name))")
                .eq("user_id", user.id)
                .eq("status", "completed")
                .order("completed_at", { ascending: true }); // Chronological for graph

            if (sessions) {
                // 1. Process Volume Progression (Tonnage over time)
                const processedVolume = sessions.map(session => {
                    const tonnage = session.workout_logs.reduce((acc: number, log: any) => {
                        return acc + (log.weight_kg * log.reps_completed);
                    }, 0);

                    return {
                        date: new Date(session.completed_at!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        tonnage: Math.round(tonnage)
                    };
                });
                setVolumeData(processedVolume);

                // 2. Process Muscle Radar (Volume check)
                // Since we don't have explicit muscle groups in DB yet, we'll map common names or leave generic for MVP
                // Mocking muscle data distribution for now based on exercise counts
                const muscleCounts: Record<string, number> = {};
                sessions.forEach(s => {
                    s.workout_logs.forEach((l: any) => {
                        const name = l.exercises?.name?.toLowerCase() || "";
                        let muscle = "General";
                        if (name.includes("sentadilla") || name.includes("squat") || name.includes("prensa")) muscle = "Pierna (Quads)";
                        else if (name.includes("peso muerto") || name.includes("deadlift")) muscle = "Pierna (Post)";
                        else if (name.includes("banca") || name.includes("press") || name.includes("chest")) muscle = "Pecho";
                        else if (name.includes("remo") || name.includes("jalon") || name.includes("pull")) muscle = "Espalda";
                        else if (name.includes("curl")) muscle = "Bíceps";
                        else if (name.includes("triceps") || name.includes("extension")) muscle = "Tríceps";
                        else if (name.includes("hombro") || name.includes("militar") || name.includes("lateral")) muscle = "Hombro";

                        muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1; // Counting sets
                    });
                });

                // Normalize for Radar Chart (Compare vs ideal 10-20 sets/week)
                // This is a rough estimation since we are aggregating ALL time, not weekly.
                // For a proper weekly view, we'd filter by last 7 days.
                const radar = Object.keys(muscleCounts).map(muscle => ({
                    subject: muscle,
                    A: Math.min(muscleCounts[muscle], 20), // Cap for visual
                    fullMark: 20
                }));
                // Ensure basic points if empty
                if (radar.length < 3) {
                    radar.push({ subject: "Pecho", A: 0, fullMark: 20 });
                    radar.push({ subject: "Espalda", A: 0, fullMark: 20 });
                    radar.push({ subject: "Pierna", A: 0, fullMark: 20 });
                }
                setMuscleRadarData(radar);
            }

            setLoading(false);
        };

        fetchStats();
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen bg-muted/10 p-6 pb-24 space-y-6">
            <h1 className="text-3xl font-bold">Estadísticas de Progreso</h1>
            <p className="text-muted-foreground">Analizando tu hipertrofia y rendimiento.</p>

            <Tabs defaultValue="volume" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="volume">Volumen & Carga</TabsTrigger>
                    <TabsTrigger value="balance">Balance Muscular</TabsTrigger>
                </TabsList>

                <TabsContent value="volume" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Curva de Sobrecarga Progresiva</CardTitle>
                            <CardDescription>Tonelaje total (Kg x Reps) por sesión</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={volumeData}>
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", borderRadius: "8px", border: "none", color: "#fff" }}
                                    />
                                    <Line type="monotone" dataKey="tonnage" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Sets Efectivos Semanales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">12.5</div>
                                <p className="text-xs text-muted-foreground">Promedio (Sweet Spot: 10-20)</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Ratio Fuerza Relativa</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">1.2x</div>
                                <p className="text-xs text-muted-foreground">Peso Corporal (Objetivo: 1.5x)</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="balance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Radar de Volumen Muscular</CardTitle>
                            <CardDescription>Visualización de tu enfoque por grupo muscular</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={muscleRadarData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 20]} stroke="#e5e7eb" />
                                    <Radar name="Sets Actually Done" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
