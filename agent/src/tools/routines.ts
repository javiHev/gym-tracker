import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Base URL para el API (se puede configurar según el entorno)
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Schema para crear rutina
const CreateRoutineSchema = z.object({
    userId: z.string().describe("ID del usuario (obtenido del contexto)"),
    name: z.string().describe("Nombre de la rutina"),
    description: z.string().optional().describe("Descripción opcional"),
    days: z.array(z.object({
        name: z.string().describe("Nombre del día (ej: 'Push Day')"),
        day_number: z.number().describe("Número del día (1, 2, 3...)"),
        exercises: z.array(z.object({
            name: z.string().describe("Nombre del ejercicio"),
            sets: z.number().describe("Número de series"),
            reps: z.string().describe("Rango de repeticiones (ej: '8-12')"),
            rest_seconds: z.number().optional().describe("Descanso en segundos"),
        })).describe("Lista de ejercicios para este día"),
    })).describe("Días de la rutina"),
});

// Schema para actualizar rutina
const UpdateRoutineSchema = z.object({
    userId: z.string().describe("ID del usuario (obtenido del contexto)"),
    routine_id: z.string().describe("ID de la rutina a actualizar"),
    name: z.string().optional().describe("Nuevo nombre"),
    description: z.string().optional().describe("Nueva descripción"),
    is_active: z.boolean().optional().describe("Estado activo/inactivo"),
});

// Schema para eliminar rutina
const DeleteRoutineSchema = z.object({
    userId: z.string().describe("ID del usuario (obtenido del contexto)"),
    routine_id: z.string().describe("ID de la rutina a eliminar"),
});

// Schema para obtener rutinas
const GetRoutinesSchema = z.object({
    userId: z.string().describe("ID del usuario (obtenido del contexto)"),
    include_archived: z.boolean().optional().describe("Incluir rutinas archivadas"),
});

/**
 * Helper function to call the routines API
 */
async function callRoutinesAPI(action: string, payload: any) {
    console.log(`🚀 Calling Routines API: ${action}`, payload);
    try {
        const response = await fetch(`${API_BASE_URL}/api/routines`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ action, payload }),
        });

        console.log(`📡 API Response Status: ${response.status}`);

        if (!response.ok) {
            const error = await response.json();
            console.error(`❌ API Error:`, error);
            throw new Error(error.error || "API request failed");
        }

        const data = await response.json();
        console.log(`✅ API Success:`, data);
        return data;
    } catch (error: any) {
        console.error(`💥 API Exception:`, error.message);
        throw new Error(`API call failed: ${error.message}`);
    }
}

/**
 * Tool para crear una rutina completa
 */
export const createRoutineTool = new DynamicStructuredTool({
    name: "create_routine",
    description: "Crea una rutina de entrenamiento completa con días y ejercicios. Usa esta tool cuando el usuario quiera crear una nueva rutina. IMPORTANTE: Siempre usa el userId disponible.",
    schema: CreateRoutineSchema,
    func: async (args) => {
        try {
            const result = await callRoutinesAPI("create_routine", args);
            return JSON.stringify(result);
        } catch (error: any) {
            return JSON.stringify({
                success: false,
                error: error.message,
            });
        }
    },
});

/**
 * Tool para obtener rutinas del usuario
 */
export const getRoutinesTool = new DynamicStructuredTool({
    name: "get_routines",
    description: "Obtiene todas las rutinas del usuario. Útil para mostrar, listar o consultar rutinas existentes.",
    schema: GetRoutinesSchema,
    func: async (args) => {
        try {
            const result = await callRoutinesAPI("get_routines", args);
            return JSON.stringify(result);
        } catch (error: any) {
            return JSON.stringify({
                success: false,
                error: error.message,
            });
        }
    },
});

/**
 * Tool para actualizar una rutina
 */
export const updateRoutineTool = new DynamicStructuredTool({
    name: "update_routine",
    description: "Actualiza los datos de una rutina existente (nombre, descripción, estado activo).",
    schema: UpdateRoutineSchema,
    func: async (args) => {
        try {
            const result = await callRoutinesAPI("update_routine", args);
            return JSON.stringify(result);
        } catch (error: any) {
            return JSON.stringify({
                success: false,
                error: error.message,
            });
        }
    },
});

/**
 * Tool para eliminar una rutina
 */
export const deleteRoutineTool = new DynamicStructuredTool({
    name: "delete_routine",
    description: "Elimina una rutina permanentemente. Usa con precaución. SIEMPRE pide confirmación al usuario antes de eliminar.",
    schema: DeleteRoutineSchema,
    func: async (args) => {
        try {
            const result = await callRoutinesAPI("delete_routine", args);
            return JSON.stringify(result);
        } catch (error: any) {
            return JSON.stringify({
                success: false,
                error: error.message,
            });
        }
    },
});

// Exportar todas las tools
export const routineTools = [
    createRoutineTool,
    getRoutinesTool,
    updateRoutineTool,
    deleteRoutineTool,
];
