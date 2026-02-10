import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    // We need a user to attach the routine to. 
    // For this seed script, we'll try to get the current session user.
    // If no user, we can't seed properly with RLS.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized. Please log in to seed data." }, { status: 401 });
    }

    const userId = user.id;

    // 1. Check if user already has a profile (trigger usually creates it, but to be safe)
    // We assume profile exists or RLS allows insert.

    // 2. Create a Routine
    const { data: routine, error: routineError } = await supabase
        .from("routines")
        .insert({
            user_id: userId,
            name: "Rutina Inicial: Full Body",
            description: "Rutina de cuerpo completo para empezar fuerte.",
            is_active: true
        })
        .select()
        .single();

    if (routineError) return NextResponse.json({ error: routineError.message }, { status: 500 });
    if (!routine) return NextResponse.json({ error: "Failed to create routine" }, { status: 500 });

    // 3. Create Routine Days
    const days = [
        { name: "Día A", day_number: 1, color: "#3B82F6" },
        { name: "Día B", day_number: 2, color: "#10B981" },
        { name: "Día C", day_number: 3, color: "#F59E0B" }
    ];

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const createdDays: any[] = [];

    for (const day of days) {
        const { data: dayData, error: dayError } = await supabase
            .from("routine_days")
            .insert({
                routine_id: routine.id,
                name: day.name,
                day_number: day.day_number,
                color: day.color
            })
            .select()
            .single();

        if (dayError) console.error("Error creating day", dayError);
        if (dayData) createdDays.push(dayData);
    }

    // 4. Create Exercises for Day A
    if (createdDays.length > 0) {
        const dayA = createdDays[0];
        const exercisesA = [
            { name: "Sentadilla (Squat)", base_sets: 3, base_reps: "8-10", order_index: 1 },
            { name: "Press Banca", base_sets: 3, base_reps: "8-12", order_index: 2 },
            { name: "Remo con Barra", base_sets: 3, base_reps: "10-12", order_index: 3 },
        ];

        for (const ex of exercisesA) {
            await supabase.from("exercises").insert({
                routine_day_id: dayA.id,
                name: ex.name,
                base_sets: ex.base_sets,
                base_reps: ex.base_reps,
                order_index: ex.order_index,
                target_weight_kg: 20, // Example start
                target_sets: ex.base_sets,
                target_reps: ex.base_reps
            });
        }
    }

    return NextResponse.json({ success: true, message: "Rutina inicial creada", routineId: routine.id });
}
