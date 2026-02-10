"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ProfileView } from "@/components/profile/ProfileView";
import { UserProfile } from "@/types/profiles";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // Intentar obtener el perfil de la tabla 'profiles'
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error && error.code !== "PGRST116") { // PGRST116 es "no rows returned"
                throw error;
            }

            if (data) {
                setProfile({
                    id: data.id,
                    name: data.full_name || "",
                    email: user.email || "",
                    weight: data.weight_kg || 0,
                    height: data.height_cm || 0,
                    units: data.units || "metric",
                    created_at: data.created_at,
                });
            } else {
                // Si no existe el perfil, crear uno básico con los datos del usuario auth
                const newProfile: any = {
                    id: user.id,
                    full_name: user.user_metadata?.full_name || "",
                    units: "metric",
                    theme: "auto",
                };

                const { error: insertError } = await supabase
                    .from("profiles")
                    .insert(newProfile);

                if (insertError) throw insertError;

                setProfile({
                    id: user.id,
                    name: newProfile.full_name,
                    email: user.email || "",
                    weight: 0,
                    height: 0,
                    units: "metric",
                });
            }
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            toast.error("Error al cargar el perfil");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (updatedProfile: UserProfile) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: updatedProfile.name,
                    weight_kg: updatedProfile.weight,
                    height_cm: updatedProfile.height,
                    units: updatedProfile.units,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", updatedProfile.id);

            if (error) throw error;

            setProfile(updatedProfile);
            toast.success("Perfil actualizado correctamente");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error("Error al actualizar el perfil");
            throw error; // Para que el componente maneje el estado de carga/éxito
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Error al cerrar sesión");
        } else {
            router.push("/login");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-black" />
                    <p className="text-zinc-500 font-medium animate-pulse">Cargando tu perfil...</p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-white">
            <header className="px-6 py-6 border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="max-w-md mx-auto">
                    <h1 className="text-2xl font-bold text-black tracking-tight italic">Mi Perfil</h1>
                </div>
            </header>
            <main className="px-6 py-8">
                <ProfileView
                    profile={profile}
                    onUpdateProfile={handleUpdateProfile}
                    onLogout={handleLogout}
                />
            </main>
        </div>
    );
}
