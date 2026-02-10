"use client";

import { useState, useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { useCopilotReadable } from "@copilotkit/react-core";
import { createClient } from "@/lib/supabase";
import { useRoutineActions } from "@/hooks/useRoutineActions";
import { RoutineToolRenderers } from "@/components/routines/RoutineToolRenderers";

// Componente interno que registra el contexto del usuario via useCopilotReadable
// (debe ser hijo de <CopilotKit> para que funcione)
function UserContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    birth_date: string | null;
    units: string;
  } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        });

        // Traer perfil desde Supabase
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, weight_kg, height_cm, birth_date, units")
          .eq("id", data.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }
    });
  }, []);

  // Contexto raíz: identidad del usuario
  const userContextId = useCopilotReadable({
    description: "Usuario autenticado",
    value: user ? { userId: user.id, email: user.email } : null,
  });

  // Hijo: datos físicos del perfil
  useCopilotReadable({
    description: "Datos físicos del usuario",
    value: profile
      ? {
          nombre: profile.full_name,
          peso_kg: profile.weight_kg,
          altura_cm: profile.height_cm,
        }
      : null,
    parentId: userContextId,
  });

  // Hijo: preferencias y metadata
  useCopilotReadable({
    description: "Preferencias del usuario",
    value: profile
      ? {
          unidades: profile.units,
          fecha_nacimiento: profile.birth_date,
        }
      : null,
    parentId: userContextId,
  });

  // Registrar frontend tools para CRUD de rutinas (ejecutan en browser con auth)
  useRoutineActions();

  return (
    <>
      {/* Renderizadores visuales para tool calls del agente */}
      <RoutineToolRenderers />
      {children}
    </>
  );
}

export default function CopilotProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="grit_coach"
    >
      <UserContextProvider>{children}</UserContextProvider>
    </CopilotKit>
  );
}
