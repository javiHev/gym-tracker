"use client";

import { Calendar, ChevronRight, Dumbbell, Pencil, Trash2 } from "lucide-react";
import { Routine } from "@/types/routines";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RoutineCardProps {
    routine: Routine;
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

export function RoutineCard({ routine, onClick, onEdit, onDelete }: RoutineCardProps) {
    return (
        <Card
            onClick={onClick}
            className="group relative cursor-pointer transition-all duration-300 hover:border-primary/50 overflow-hidden"
        >
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(e);
                        }}
                    >
                        <Pencil size={14} className="text-muted-foreground" />
                    </Button>
                )}
                {onDelete && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(e);
                        }}
                    >
                        <Trash2 size={14} />
                    </Button>
                )}
            </div>

            {/* Status Badge - moved down slightly if there's no space or handled by actions */}
            {routine.is_active && !onEdit && !onDelete && (
                <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                        Activa
                    </Badge>
                </div>
            )}

            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold pr-20">{routine.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                    {routine.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="pb-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-primary" />
                        <span>{routine.days?.length || 0} días/sem</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Dumbbell size={16} className="text-primary" />
                        <span>Fuerza</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-between items-center border-t bg-muted/20 px-6 py-3">
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Ver detalles
                </span>
                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground group-hover:text-foreground">
                    <ChevronRight size={18} />
                </Button>
            </CardFooter>
        </Card>
    );
}
