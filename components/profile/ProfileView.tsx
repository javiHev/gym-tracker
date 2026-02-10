"use client";

import React, { useState } from 'react';
import { User, Ruler, Weight, LogOut, Save, Mail, Settings, Loader2, Activity } from 'lucide-react';
import { UserProfile } from '@/types/profiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileViewProps {
    profile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
    onLogout: () => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdateProfile, onLogout }) => {
    const [formData, setFormData] = useState<UserProfile>(profile);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (field: keyof UserProfile, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setIsSaved(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onUpdateProfile(formData);
        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-zinc-200">
                    {formData.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900">{formData.name || 'Usuario'}</h2>
                    <p className="text-zinc-500 text-sm">Miembro desde {profile.created_at ? new Date(profile.created_at).getFullYear() : '2025'}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Personal Stats Section */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Datos Personales
                    </h3>
                    <Card className="border-zinc-200 shadow-sm">
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-semibold text-zinc-500 uppercase">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="bg-zinc-50 border-zinc-200 focus:ring-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase">Correo Electrónico</Label>
                                <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed">
                                    <Mail className="w-4 h-4 mr-2 opacity-50" />
                                    <span className="text-sm">{formData.email}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Body Stats Section */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Estadísticas Físicas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-zinc-200 shadow-sm overflow-hidden text-center">
                            <CardContent className="p-4 bg-white">
                                <div className="flex items-center justify-center gap-2 text-zinc-500 mb-2">
                                    <Weight className="w-4 h-4" />
                                    <Label className="text-xs font-semibold uppercase">Peso ({formData.units === 'metric' ? 'kg' : 'lbs'})</Label>
                                </div>
                                <Input
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                                    className="text-2xl font-bold text-center bg-transparent border-0 border-b border-transparent focus-visible:border-black focus-visible:ring-0 rounded-none h-auto p-0"
                                />
                            </CardContent>
                        </Card>
                        <Card className="border-zinc-200 shadow-sm overflow-hidden text-center">
                            <CardContent className="p-4 bg-white">
                                <div className="flex items-center justify-center gap-2 text-zinc-500 mb-2">
                                    <Ruler className="w-4 h-4" />
                                    <Label className="text-xs font-semibold uppercase">Altura ({formData.units === 'metric' ? 'cm' : 'ft'})</Label>
                                </div>
                                <Input
                                    type="number"
                                    value={formData.height}
                                    onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                                    className="text-2xl font-bold text-center bg-transparent border-0 border-b border-transparent focus-visible:border-black focus-visible:ring-0 rounded-none h-auto p-0"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Preferences Section */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Preferencias
                    </h3>
                    <Card className="border-zinc-200 shadow-sm overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-700 uppercase tracking-tight">Sistema de Unidades</span>
                                <div className="flex bg-zinc-100 rounded-lg p-1">
                                    <button
                                        onClick={() => handleChange('units', 'metric')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${formData.units === 'metric' ? 'bg-white shadow-md text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                                            }`}
                                    >
                                        Métrico
                                    </button>
                                    <button
                                        onClick={() => handleChange('units', 'imperial')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${formData.units === 'imperial' ? 'bg-white shadow-md text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                                            }`}
                                    >
                                        Imperial
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full py-6 text-base font-bold transition-all duration-300 ${isSaved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-black text-white hover:bg-zinc-800'
                        }`}
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : isSaved ? (
                        <>
                            <Save className="w-5 h-5 mr-2" /> ¡Cambios Guardados!
                        </>
                    ) : (
                        'Guardar Cambios'
                    )}
                </Button>

                <div className="pt-8 border-t border-zinc-100">
                    <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 py-6 font-semibold" onClick={onLogout}>
                        <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
                    </Button>
                    <p className="text-center text-[10px] text-zinc-400 mt-6 uppercase tracking-[0.2em] font-medium">Grit Tracker AI v1.0.0</p>
                </div>
            </div>
        </div>
    );
};

