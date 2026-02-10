"use client";

import { useState, useEffect } from "react";
import { Check, Dumbbell, Target, History, RefreshCw } from "lucide-react";
import { Exercise } from "@/types/routines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCopilotReadable } from "@copilotkit/react-core";

interface ActiveExerciseProps {
    exercise: Exercise;
    logs: any[]; // Existing logs for this exercise in current session
    historyLogs: any[]; // Last session logs for this exercise
    onSetComplete: (setNumber: number, weight: number, reps: number, rir: number) => void;
}

export function ActiveExercise({ exercise, logs: initialLogs, historyLogs, onSetComplete }: ActiveExerciseProps) {
    const targetSets = exercise.target_sets || exercise.base_sets || 3;
    const [sets, setSets] = useState<any[]>([]);
    const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

    useEffect(() => {
        const maxSetNum = Math.max(targetSets, ...initialLogs.map(l => l.set_number), 0);
        const newSets = Array.from({ length: maxSetNum }).map((_, i) => {
            const setNum = i + 1;
            const existingLog = initialLogs.find(l => l.set_number === setNum);
            const historyLog = historyLogs.find(l => l.set_number === setNum); // Find matching set from history

            return {
                setNumber: setNum,
                weight: existingLog?.weight_kg?.toString() || "",
                reps: existingLog?.reps_completed?.toString() || "",
                rir: existingLog?.rir?.toString() || "",
                completed: !!existingLog,
                id: existingLog?.id,

                // Targets (Prioritize explicitly set target, then history, then placeholder)
                targetWeight: exercise.target_weight_kg?.toString() || historyLog?.weight_kg?.toString() || "-",
                targetReps: exercise.target_reps || historyLog?.reps_completed?.toString() || exercise.base_reps || "-",
                targetRir: exercise.target_rir?.toString() || historyLog?.rir?.toString() || "2",

                // History data for display
                history: historyLog
            };
        });
        setSets(newSets);
    }, [initialLogs, targetSets, exercise, historyLogs]);

    useCopilotReadable({
        description: `Current state of sets for ${exercise.name}`,
        value: {
            sets,
            historyLogs
        }
    });

    const handleInputChange = (index: number, field: string, value: string) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        setSets(newSets);
    };

    const toggleComplete = (index: number) => {
        const set = sets[index];
        if (!set.completed) {
            if (!set.weight || !set.reps) return;

            onSetComplete(
                set.setNumber,
                parseFloat(set.weight),
                parseInt(set.reps),
                parseInt(set.rir) || 0
            );

            const newSets = [...sets];
            newSets[index].completed = true;
            setSets(newSets);
        }
    };

    const toggleHistory = (index: number) => {
        setExpandedHistory(expandedHistory === index ? null : index);
    };

    return (
        <Card className="border-l-4 border-l-primary mb-6 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-muted/30 pb-3 pt-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold">{exercise.name}</CardTitle>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-background">
                                <Target className="w-3 h-3 mr-1" />
                                {exercise.target_weight_kg ? `${exercise.target_weight_kg}kg` : '-'}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-background">
                                <History className="w-3 h-3 mr-1" />
                                {exercise.target_reps || exercise.base_reps} reps
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>

            {/* Sets Area */}
            <CardContent className="p-0">
                <div className="grid grid-cols-[30px_1fr_1fr_1fr_40px_30px] gap-2 p-2 bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground text-center">
                    <div>#</div>
                    <div>Kg</div>
                    <div>Reps</div>
                    <div>RIR</div>
                    <div></div>
                    <div></div>
                </div>

                <div className="divide-y relative">
                    {sets.map((set, i) => (
                        <div key={i} className="relative group">
                            <div
                                className={cn(
                                    "grid grid-cols-[30px_1fr_1fr_1fr_40px_30px] gap-2 items-center p-2 transition-colors",
                                    set.completed ? "bg-muted/20 opacity-70" : "bg-card"
                                )}
                            >
                                <div className="text-center font-mono text-sm text-muted-foreground">{set.setNumber}</div>

                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={set.weight}
                                    onChange={(e) => handleInputChange(i, 'weight', e.target.value)}
                                    placeholder={set.targetWeight}
                                    disabled={set.completed}
                                    className="h-9 text-center p-1 placeholder:text-muted-foreground/40 placeholder:font-medium"
                                />

                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={set.reps}
                                    onChange={(e) => handleInputChange(i, 'reps', e.target.value)}
                                    placeholder={set.targetReps}
                                    disabled={set.completed}
                                    className="h-9 text-center p-1 placeholder:text-muted-foreground/40 placeholder:font-medium"
                                />

                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={set.rir}
                                    onChange={(e) => handleInputChange(i, 'rir', e.target.value)}
                                    placeholder={set.targetRir}
                                    disabled={set.completed}
                                    className="h-9 text-center p-1 placeholder:text-muted-foreground/40 placeholder:font-medium"
                                />

                                <Button
                                    size="icon"
                                    variant={set.completed ? "secondary" : "default"}
                                    onClick={() => toggleComplete(i)}
                                    disabled={set.completed}
                                    className={cn(
                                        "h-9 w-9 shrink-0",
                                        set.completed && "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                    )}
                                >
                                    <Check size={16} strokeWidth={3} />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => toggleHistory(i)}
                                    className={cn("h-8 w-8 text-muted-foreground", expandedHistory === i && "text-primary bg-muted")}
                                >
                                    <RefreshCw size={14} />
                                </Button>
                            </div>

                            {/* History Popover / Expansion */}
                            {expandedHistory === i && (
                                <div className="bg-muted/30 p-2 text-xs text-center border-t border-b flex justify-center items-center gap-4 animate-in slide-in-from-top-2">
                                    <span className="font-semibold text-muted-foreground">Sesión Anterior:</span>
                                    {set.history ? (
                                        <div className="flex gap-3">
                                            <span className="bg-background px-2 py-1 rounded border shadow-sm font-mono">{set.history.weight_kg}kg</span>
                                            <span className="bg-background px-2 py-1 rounded border shadow-sm font-mono">{set.history.reps_completed} reps</span>
                                            <span className="bg-background px-2 py-1 rounded border shadow-sm font-mono">RIR {set.history.rir ?? '-'}</span>
                                        </div>
                                    ) : (
                                        <span className="italic text-muted-foreground/70">Sin datos previos</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
