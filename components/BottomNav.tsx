"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        {
            href: "/dashboard",
            label: "Inicio",
            icon: Home,
        },
        {
            href: "/routines",
            label: "Rutinas",
            icon: Calendar,
        },
        {
            href: "/stats",
            label: "Progreso",
            icon: Calendar, // TODO: Use better icon like 'Activity' or 'PieChart'
        },
        {
            href: "/exercises",
            label: "Ejercicios",
            icon: Dumbbell,
        },
        {
            href: "/profile",
            label: "Perfil",
            icon: User,
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full bg-background/80 backdrop-blur-lg border-t safe-area-bottom">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 group",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-primary/10"
                                    : "group-hover:bg-muted"
                            )}>
                                <Icon size={20} className={cn(isActive && "fill-current")} />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
