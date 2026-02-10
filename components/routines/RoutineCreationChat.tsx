"use client";

import { useState, useEffect } from "react";
import { useCopilotChatSuggestions, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { createClient } from "@/lib/supabase";
import { RoutineToolRenderers } from "./RoutineToolRenderers";
import { Loader2 } from "lucide-react";

export function RoutineCreationChat({ onComplete }: { onComplete: () => void }) {
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUser();
    }, []);

    // Pasamos el userId al agente
    useCopilotReadable({
        description: `ID del usuario actual: ${userId}`,
        value: userId,
    });

    // Chat suggestions to guide the user
    useCopilotChatSuggestions({
        instructions: "Sugiere prompts útiles para crear una rutina de entrenamiento",
        minSuggestions: 2,
        maxSuggestions: 4,
    });

    return (
        <div className="space-y-4">
            {/* Tool Renderers for visual feedback */}
            <RoutineToolRenderers />

            {/* Solo mostramos el chat cuando tenemos el userId para evitar fallos de grabación */}
            {!userId ? (
                <div className="h-[600px] flex items-center justify-center border rounded-xl bg-muted/20">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Cargando perfil del entrenador...</p>
                    </div>
                </div>
            ) : (
                <div className="h-[600px] border rounded-xl overflow-hidden shadow-inner bg-background">
                    <CopilotChat
                        labels={{
                            title: "GRIT Coach - Diseñador de Rutinas",
                            initial: `¡Hola! Soy GRIT Coach. Estoy listo para diseñar tu rutina personalizada.`,
                        }}
                        instructions={`
Eres un entrenador personal experto. Tu objetivo es diseñar rutinas de alta calidad.

CONTEXTO DE SEGURIDAD:
- USER_ID: ${userId}
- Debes usar este ID en todas las llamadas a herramientas.

PASOS A SEGUIR:
1. Habla con el usuario para entender sus objetivos.
2. Usa 'create_routine' para guardar.
`}
                    />
                </div>
            )}
        </div>
    );
}
