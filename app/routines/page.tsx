"use client";

import { useState, useEffect } from "react";
import { useCopilotReadable } from "@copilotkit/react-core";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import { Routine } from "@/types/routines";
import { RoutineCard } from "@/components/RoutineCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RoutineCreationChat } from "@/components/routines/RoutineCreationChat";

export default function RoutinesPage() {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showChatDialog, setShowChatDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const fetchRoutines = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("routines")
            .select(`
                *,
                days:routine_days(
                    *,
                    exercises(*)
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Error cargando rutinas");
            console.error(error);
        } else {
            setRoutines(data as unknown as Routine[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRoutines();
    }, []);

    const handleSeed = async () => {
        const toastId = toast.loading("Creando rutina de ejemplo...");
        try {
            const res = await fetch("/api/seed");
            if (!res.ok) throw new Error("Error en seed");
            const data = await res.json();
            if (data.success) {
                toast.success("Rutina creada!", { id: toastId });
                fetchRoutines();
            } else {
                toast.error("Error: " + data.error, { id: toastId });
            }
        } catch (e) {
            toast.error("Error al conectar con servidor", { id: toastId });
        }
    };

    // Provide context to Copilot
    useCopilotReadable({
        description: "The user's list of workout routines",
        value: routines,
    });

    const handleChatComplete = () => {
        setShowChatDialog(false);
        fetchRoutines();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta rutina?")) return;

        const { error } = await supabase.from("routines").delete().eq("id", id);
        if (error) {
            toast.error("Error al eliminar la rutina");
        } else {
            toast.success("Rutina eliminada");
            fetchRoutines();
        }
    };

    const handleEdit = (routine: Routine) => {
        setEditingRoutine(routine);
        setShowEditDialog(true);
    };

    const handleCreateManual = () => {
        setEditingRoutine({ name: "", description: "" });
        setShowEditDialog(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRoutine?.name) return;

        setIsSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const routineData = {
            name: editingRoutine.name,
            description: editingRoutine.description || "",
            user_id: user.id,
            is_active: editingRoutine.is_active ?? true,
        };

        let error;
        if (editingRoutine.id) {
            const { error: updateError } = await supabase
                .from("routines")
                .update(routineData)
                .eq("id", editingRoutine.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from("routines")
                .insert([routineData]);
            error = insertError;
        }

        if (error) {
            toast.error("Error al guardar la rutina");
        } else {
            toast.success(editingRoutine.id ? "Rutina actualizada" : "Rutina creada");
            setShowEditDialog(false);
            fetchRoutines();
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/10 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-4">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Mis Rutinas
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={handleCreateManual}
                        >
                            <Plus size={20} />
                        </Button>
                        <Button
                            size="icon"
                            className="rounded-full shadow-lg shadow-primary/20"
                            onClick={() => setShowChatDialog(true)}
                        >
                            <MessageSquare size={20} />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 py-6 space-y-4">
                {routines.map((routine) => (
                    <RoutineCard
                        key={routine.id}
                        routine={routine}
                        onClick={() => router.push(`/routines/${routine.id}`)}
                        onEdit={() => handleEdit(routine)}
                        onDelete={() => handleDelete(routine.id)}
                    />
                ))}

                {routines.length === 0 && (
                    <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                        <p className="text-sm text-primary font-medium mb-3">
                            No tienes rutinas aún.
                        </p>
                        <Button onClick={handleSeed} variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary mb-4">
                            Generar Rutina de Ejemplo
                        </Button>

                        <p className="text-xs text-muted-foreground mb-4">
                            O pídele al AI Coach que te cree una.
                        </p>
                        <Button
                            variant="ghost"
                            className="text-primary/70 gap-2"
                            onClick={() => setShowChatDialog(true)}
                        >
                            <MessageSquare size={16} />
                            Abrir Chat con IA
                        </Button>
                    </div>
                )}
            </main>

            {/* Edit/Create Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingRoutine?.id ? "Editar Rutina" : "Nueva Rutina"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Rutina</Label>
                            <Input
                                id="name"
                                value={editingRoutine?.name || ""}
                                onChange={(e) => setEditingRoutine({ ...editingRoutine!, name: e.target.value })}
                                placeholder="Ej: Empuje / Tirón"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <textarea
                                id="description"
                                className="w-full p-3 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px]"
                                value={editingRoutine?.description || ""}
                                onChange={(e) => setEditingRoutine({ ...editingRoutine!, description: e.target.value })}
                                placeholder="Describe el enfoque de esta rutina..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setShowEditDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSaving} className="min-w-[100px]">
                                {isSaving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Chat Dialog */}
            <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="text-primary" />
                            Crear Rutina con IA
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        <RoutineCreationChat onComplete={handleChatComplete} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
