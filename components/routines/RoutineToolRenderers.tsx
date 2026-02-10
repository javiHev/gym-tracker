"use client";

import { useRenderToolCall, useDefaultTool } from "@copilotkit/react-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Dumbbell, Calendar, Trash2, Edit } from "lucide-react";

/**
 * Componente para renderizar visualmente la creación de rutinas
 */
export function RoutineToolRenderers() {
    // Default renderer para TODAS las tools (útil para debugging)
    useDefaultTool({
        render: ({ name, args, status, result }) => {
            console.log("🔧 Tool ejecutada:", { name, args, status, result });

            return (
                <Card className="border-2 border-purple-300 dark:border-purple-700 shadow-lg my-2">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-950/30 dark:to-purple-950/10">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {status === "executing" && <Loader2 className="animate-spin text-purple-500" size={20} />}
                            {status === "complete" && <CheckCircle2 className="text-green-500" size={20} />}
                            <span className="text-purple-700 dark:text-purple-300">
                                {status === "executing" && `Ejecutando ${name}...`}
                                {status === "complete" && `${name} completado`}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-2">
                            <div className="text-sm">
                                <span className="font-medium">Tool:</span> {name}
                            </div>
                            {args && Object.keys(args).length > 0 && (
                                <div className="text-sm">
                                    <span className="font-medium">Argumentos:</span>
                                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                                        {JSON.stringify(args, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {status === "complete" && result && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                        ✓ Completado
                                    </p>
                                    <pre className="mt-1 text-xs text-green-600 dark:text-green-500 overflow-auto max-h-40">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        },
    });

    // Renderizar tool de creación de rutina (Soporta Streaming)
    useRenderToolCall({
        name: "create_routine",
        render: ({ status, args, result }) => {
            const isExecuting = status === "executing" || status === "inProgress";
            const isComplete = status === "complete";

            // Si no hay argumentos todavía, mostramos un estado inicial
            if (!args || (isExecuting && !args.name && !args.days)) {
                return (
                    <Card className="border-2 border-primary/30 shadow-lg my-2 animate-pulse">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Loader2 className="animate-spin text-primary" size={20} />
                                Diseñando rutina...
                            </CardTitle>
                        </CardHeader>
                    </Card>
                );
            }

            return (
                <Card className="border-2 border-primary/30 shadow-lg my-2 transition-all duration-500">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {isExecuting && <Loader2 className="animate-spin text-primary" size={20} />}
                            {isComplete && <CheckCircle2 className="text-green-500" size={20} />}
                            <Dumbbell className="text-primary" size={20} />
                            <span>{args.name || "Nueva Rutina"}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3">
                            {args.description && (
                                <p className="text-sm text-muted-foreground italic">"{args.description}"</p>
                            )}

                            {/* Días y ejercicios con scroll progresivo */}
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {args.days?.map((day: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-3 bg-muted/30 border-primary/10"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar size={14} className="text-primary" />
                                            <span className="font-bold text-sm">{day.name || `Día ${idx + 1}`}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {day.exercises?.map((ex: any, exIdx: number) => (
                                                <div
                                                    key={exIdx}
                                                    className="flex justify-between items-center text-xs py-1.5 px-2 rounded bg-background/50 border border-transparent hover:border-primary/20"
                                                >
                                                    <span className="font-medium">{ex.name || "... preparando ejercicio"}</span>
                                                    <Badge variant="secondary" className="text-[10px] h-5">
                                                        {ex.sets || "?"}x{ex.reps || "?"}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {isExecuting && (!day.exercises || day.exercises.length === 0) && (
                                                <div className="h-4 w-2/3 bg-primary/5 animate-pulse rounded" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isExecuting && (!args.days || args.days.length === 0) && (
                                    <div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
                                        Generando estructura de días...
                                    </div>
                                )}
                            </div>

                            {/* Resultado Final */}
                            {isComplete && result && (
                                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-bold flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        ¡Guardado! {result.routine_name}
                                    </p>
                                    <p className="text-[11px] text-green-600 dark:text-green-500 mt-1">
                                        {result.message}
                                    </p>
                                </div>
                            )}

                            {isExecuting && (
                                <div className="flex items-center justify-center py-2">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        },
    });

    // Renderizar tool de actualización de rutina
    useRenderToolCall({
        name: "update_routine",
        render: ({ status, args, result }) => {
            const isExecuting = status === "executing";
            const isComplete = status === "complete";

            return (
                <Card className="border-2 border-orange-300 dark:border-orange-700 shadow-lg my-2">
                    <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-950/30 dark:to-orange-950/10">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {isExecuting && <Loader2 className="animate-spin text-orange-500" size={20} />}
                            {isComplete && <CheckCircle2 className="text-green-500" size={20} />}
                            <Edit className="text-orange-500" size={20} />
                            {isExecuting && "Actualizando rutina..."}
                            {isComplete && "Rutina actualizada"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {args && (
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">ID:</span> {args.routine_id}
                                </p>
                                {args.name && (
                                    <p className="text-sm">
                                        <span className="font-medium">Nuevo nombre:</span> {args.name}
                                    </p>
                                )}
                                {args.description && (
                                    <p className="text-sm">
                                        <span className="font-medium">Nueva descripción:</span> {args.description}
                                    </p>
                                )}
                                {args.is_active !== undefined && (
                                    <p className="text-sm">
                                        <span className="font-medium">Estado:</span>{" "}
                                        {args.is_active ? "Activa" : "Inactiva"}
                                    </p>
                                )}

                                {isComplete && result && (
                                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                            ✓ {result.message || "Rutina actualizada"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        },
    });

    // Renderizar tool de eliminación de rutina
    useRenderToolCall({
        name: "delete_routine",
        render: ({ status, args, result }) => {
            const isExecuting = status === "executing";
            const isComplete = status === "complete";

            return (
                <Card className="border-2 border-red-300 dark:border-red-700 shadow-lg my-2">
                    <CardHeader className="bg-gradient-to-r from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {isExecuting && <Loader2 className="animate-spin text-red-500" size={20} />}
                            {isComplete && <CheckCircle2 className="text-green-500" size={20} />}
                            <Trash2 className="text-red-500" size={20} />
                            {isExecuting && "Eliminando rutina..."}
                            {isComplete && "Rutina eliminada"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {args && (
                            <div className="space-y-2">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    <span className="font-medium">Eliminando rutina:</span> {args.routine_id}
                                </p>

                                {isComplete && result && (
                                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                            ✓ {result.message || "Rutina eliminada"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        },
    });

    // Renderizar tool de obtener rutinas
    useRenderToolCall({
        name: "get_routines",
        render: ({ status, args, result }) => {
            const isExecuting = status === "executing";
            const isComplete = status === "complete";

            return (
                <Card className="border-2 border-blue-300 dark:border-blue-700 shadow-lg my-2">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950/30 dark:to-blue-950/10">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {isExecuting && <Loader2 className="animate-spin text-blue-500" size={20} />}
                            {isComplete && <CheckCircle2 className="text-green-500" size={20} />}
                            <Dumbbell className="text-blue-500" size={20} />
                            {isExecuting && "Consultando rutinas..."}
                            {isComplete && "Rutinas encontradas"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {isComplete && result && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    {result.count} rutina{result.count !== 1 ? "s" : ""} encontrada{result.count !== 1 ? "s" : ""}
                                </p>
                                {result.routines && result.routines.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        {result.routines.map((routine: any) => (
                                            <div
                                                key={routine.id}
                                                className="p-2 border rounded-lg bg-muted/30"
                                            >
                                                <p className="font-medium text-sm">{routine.name}</p>
                                                {routine.description && (
                                                    <p className="text-xs text-muted-foreground">{routine.description}</p>
                                                )}
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {routine.days?.length || 0} días
                                                    </Badge>
                                                    {routine.is_active && (
                                                        <Badge variant="default" className="text-xs">
                                                            Activa
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        },
    });

    return null;
}
