"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Hook que registra las acciones de rutinas como frontend tools de CopilotKit.
 * Ejecutan en el browser con Supabase autenticado → RLS funciona.
 * El agente LangGraph las recibe vía convertActionsToDynamicStructuredTools.
 */
export function useRoutineActions(onRoutineCreated?: () => void) {
    const supabase = createClient();

    // ─── CREATE ROUTINE ──────────────────────────────────────────
    useCopilotAction({
        name: "create_routine",
        description: "Crea una rutina de entrenamiento completa con días y ejercicios. Usa esta herramienta cuando el usuario confirme que quiere crear la rutina.",
        parameters: [
            {
                name: "name",
                type: "string",
                description: "Nombre de la rutina (ej: 'Push Pull Legs')",
                required: true,
            },
            {
                name: "description",
                type: "string",
                description: "Descripción opcional de la rutina",
                required: false,
            },
            {
                name: "days",
                type: "object[]",
                description: "Días de entrenamiento con ejercicios",
                attributes: [
                    {
                        name: "name",
                        type: "string",
                        description: "Nombre del día (ej: 'Push Day')",
                        required: true,
                    },
                    {
                        name: "day_number",
                        type: "number",
                        description: "Número del día (1, 2, 3...)",
                        required: true,
                    },
                    {
                        name: "exercises",
                        type: "object[]",
                        description: "Ejercicios para este día",
                        attributes: [
                            {
                                name: "name",
                                type: "string",
                                description: "Nombre del ejercicio",
                                required: true,
                            },
                            {
                                name: "sets",
                                type: "number",
                                description: "Número de series",
                                required: true,
                            },
                            {
                                name: "reps",
                                type: "string",
                                description: "Rango de repeticiones (ej: '8-12')",
                                required: true,
                            },
                            {
                                name: "rest_seconds",
                                type: "number",
                                description: "Descanso en segundos",
                                required: false,
                            },
                        ],
                        required: true,
                    },
                ],
                required: true,
            },
        ],
        handler: async ({ name, description, days }: any) => {
            console.log("🚀 [create_routine] Iniciando creación:", { name, days });
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuario no autenticado");

                // 1. Crear la rutina
                const { data: routine, error: routineError } = await supabase
                    .from("routines")
                    .insert({
                        user_id: user.id,
                        name,
                        description,
                        is_active: true,
                    })
                    .select()
                    .single();

                if (routineError || !routine) {
                    console.error("❌ [create_routine] Error al crear rutina:", routineError);
                    throw new Error(`Error creando rutina: ${routineError?.message}`);
                }

                console.log("✅ [create_routine] Rutina creada:", routine.id);

                // 2. Crear días y ejercicios
                for (const day of days) {
                    console.log(`📅 [create_routine] Creando día: ${day.name}`, day);
                    const { data: dayData, error: dayError } = await supabase
                        .from("routine_days")
                        .insert({
                            routine_id: routine.id,
                            name: day.name,
                            day_number: Number(day.day_number),
                        })
                        .select()
                        .single();

                    if (dayError || !dayData) {
                        console.error(`❌ [create_routine] Error al crear día ${day.name}:`, dayError);
                        continue;
                    }

                    console.log(`✅ [create_routine] Día creado: ${dayData.id}. Añadiendo ${day.exercises?.length || 0} ejercicios.`);

                    if (day.exercises && day.exercises.length > 0) {
                        const exercisesToInsert = day.exercises.map((ex: any, idx: number) => ({
                            routine_day_id: dayData.id,
                            name: ex.name,
                            base_sets: Number(ex.sets),
                            base_reps: String(ex.reps),
                            rest_seconds: Number(ex.rest_seconds || 120),
                            order_index: idx,
                        }));

                        const { error: exercisesError } = await supabase
                            .from("exercises")
                            .insert(exercisesToInsert);

                        if (exercisesError) {
                            console.error(`❌ [create_routine] Error al insertar ejercicios para día ${day.name}:`, exercisesError);
                        } else {
                            console.log(`✅ [create_routine] Ejercicios insertados para día ${day.name}`);
                        }
                    } else {
                        console.warn(`⚠️ [create_routine] El día ${day.name} no tiene ejercicios.`);
                    }
                }

                toast.success(`Rutina "${name}" creada`);
                onRoutineCreated?.();

                return {
                    success: true,
                    routine_id: routine.id,
                    message: `Rutina "${name}" creada con éxito.`,
                };
            } catch (error: any) {
                console.error("💥 [create_routine] Excepción fatal:", error);
                toast.error("Error al crear la rutina");
                return { success: false, error: error.message };
            }
        },
    });

    // ─── GET ROUTINES ────────────────────────────────────────────
    useCopilotAction({
        name: "get_routines",
        description: "Obtiene las rutinas del usuario. Úsala para consultar rutinas existentes antes de crear o modificar.",
        parameters: [
            {
                name: "include_archived",
                type: "boolean",
                description: "Incluir rutinas archivadas",
                required: false,
            },
        ],
        handler: async ({ include_archived }: any) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuario no autenticado");

                let query = supabase
                    .from("routines")
                    .select(`*, days:routine_days(*, exercises(*))`)
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (!include_archived) {
                    query = query.eq("is_archived", false);
                }

                const { data, error } = await query;
                if (error) throw new Error(`Error obteniendo rutinas: ${error.message}`);

                return {
                    success: true,
                    routines: data,
                    count: data?.length || 0,
                };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        },
    });

    // ─── UPDATE ROUTINE ──────────────────────────────────────────
    useCopilotAction({
        name: "update_routine",
        description: "Actualiza nombre, descripción o estado activo de una rutina existente.",
        parameters: [
            {
                name: "routine_id",
                type: "string",
                description: "ID de la rutina a actualizar",
                required: true,
            },
            {
                name: "name",
                type: "string",
                description: "Nuevo nombre",
                required: false,
            },
            {
                name: "description",
                type: "string",
                description: "Nueva descripción",
                required: false,
            },
            {
                name: "is_active",
                type: "boolean",
                description: "Activar o desactivar la rutina",
                required: false,
            },
        ],
        handler: async ({ routine_id, name, description, is_active }: any) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuario no autenticado");

                const updates: Record<string, any> = {};
                if (name !== undefined) updates.name = name;
                if (description !== undefined) updates.description = description;
                if (is_active !== undefined) updates.is_active = is_active;

                const { data, error } = await supabase
                    .from("routines")
                    .update(updates)
                    .eq("id", routine_id)
                    .eq("user_id", user.id)
                    .select()
                    .single();

                if (error) throw new Error(`Error actualizando rutina: ${error.message}`);

                toast.success("Rutina actualizada");
                return {
                    success: true,
                    routine: data,
                    message: "Rutina actualizada correctamente.",
                };
            } catch (error: any) {
                toast.error("Error al actualizar la rutina");
                return { success: false, error: error.message };
            }
        },
    });

    // ─── DELETE ROUTINE ──────────────────────────────────────────
    useCopilotAction({
        name: "delete_routine",
        description: "Elimina una rutina permanentemente. El agente SIEMPRE debe pedir confirmación antes de usar esta herramienta.",
        parameters: [
            {
                name: "routine_id",
                type: "string",
                description: "ID de la rutina a eliminar",
                required: true,
            },
        ],
        handler: async ({ routine_id }: any) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuario no autenticado");

                const { error } = await supabase
                    .from("routines")
                    .delete()
                    .eq("id", routine_id)
                    .eq("user_id", user.id);

                if (error) throw new Error(`Error eliminando rutina: ${error.message}`);

                toast.success("Rutina eliminada");
                return {
                    success: true,
                    message: "Rutina eliminada correctamente.",
                };
            } catch (error: any) {
                toast.error("Error al eliminar la rutina");
                return { success: false, error: error.message };
            }
        },
    });

    return null;
}
