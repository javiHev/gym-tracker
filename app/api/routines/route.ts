import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    console.log("📥 [Routines API] Request received");
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { action, payload } = body;

        // Intentar obtener el userId del payload (agente) o de la sesión
        let userId = payload?.userId;

        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        switch (action) {
            case "create_routine":
                return await createRoutine(supabase, userId, payload);

            case "get_routines":
                return await getRoutines(supabase, userId, payload);

            case "update_routine":
                return await updateRoutine(supabase, userId, payload);

            case "delete_routine":
                return await deleteRoutine(supabase, userId, payload);

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Routine API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function createRoutine(supabase: any, userId: string, payload: any) {
    const { name, description, days } = payload;

    // 1. Crear la rutina
    const { data: routine, error: routineError } = await supabase
        .from("routines")
        .insert({
            user_id: userId,
            name,
            description,
            is_active: true,
        })
        .select()
        .single();

    if (routineError || !routine) {
        throw new Error(`Error creating routine: ${routineError?.message}`);
    }

    // 2. Crear los días y ejercicios
    for (const day of days) {
        const { data: dayData, error: dayError } = await supabase
            .from("routine_days")
            .insert({
                routine_id: routine.id,
                name: day.name,
                day_number: day.day_number,
            })
            .select()
            .single();

        if (dayError || !dayData) {
            throw new Error(`Error creating day: ${dayError?.message}`);
        }

        // 3. Crear ejercicios para este día
        const exercisesToInsert = day.exercises.map((ex: any, idx: number) => ({
            routine_day_id: dayData.id,
            name: ex.name,
            base_sets: ex.sets,
            base_reps: ex.reps,
            rest_seconds: ex.rest_seconds || 90,
            order_index: idx,
        }));

        const { error: exercisesError } = await supabase
            .from("exercises")
            .insert(exercisesToInsert);

        if (exercisesError) {
            throw new Error(`Error creating exercises: ${exercisesError.message}`);
        }
    }

    return NextResponse.json({
        success: true,
        routine_id: routine.id,
        routine_name: routine.name,
        days_created: days.length,
        total_exercises: days.reduce((acc: number, day: any) => acc + day.exercises.length, 0),
        message: `Rutina "${name}" creada exitosamente con ${days.length} días.`,
    });
}

async function getRoutines(supabase: any, userId: string, payload: any) {
    const { include_archived = false } = payload || {};

    let query = supabase
        .from("routines")
        .select(`
      *,
      days:routine_days(
        *,
        exercises(*)
      )
    `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (!include_archived) {
        query = query.eq("is_archived", false);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Error fetching routines: ${error.message}`);
    }

    return NextResponse.json({
        success: true,
        routines: data,
        count: data?.length || 0,
    });
}

async function updateRoutine(supabase: any, userId: string, payload: any) {
    const { routine_id, ...updates } = payload;

    const { data, error } = await supabase
        .from("routines")
        .update(updates)
        .eq("id", routine_id)
        .eq("user_id", userId) // Security: ensure user owns the routine
        .select()
        .single();

    if (error) {
        throw new Error(`Error updating routine: ${error.message}`);
    }

    return NextResponse.json({
        success: true,
        routine: data,
        message: `Rutina actualizada exitosamente.`,
    });
}

async function deleteRoutine(supabase: any, userId: string, payload: any) {
    const { routine_id } = payload;

    const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", routine_id)
        .eq("user_id", userId); // Security: ensure user owns the routine

    if (error) {
        throw new Error(`Error deleting routine: ${error.message}`);
    }

    return NextResponse.json({
        success: true,
        message: `Rutina eliminada exitosamente.`,
    });
}
