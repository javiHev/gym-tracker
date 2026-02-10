"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScheduledSession } from '@/types/routines';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface CalendarViewProps {
    schedule: ScheduledSession[];
    onSelectDate: (date: Date) => void;
    selectedDate: Date;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ schedule, onSelectDate, selectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getSessionForDate = (date: Date) => {
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        // Find session on this date. If multiple, prioritize in_progress for "resume" use case.
        return schedule.find(s => s.date === dateString);
    };

    const generateCalendarDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate); // 0 = Sunday

        // Padding for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`pad-${i}`} className="h-10 md:h-12"></div>);
        }

        // Days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isSelected = isSameDay(date, selectedDate);
            const session = getSessionForDate(date);

            let dayClass = "text-muted-foreground hover:bg-muted/50";
            let indicator = null;

            if (isSelected) {
                dayClass = "bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90";
            }

            if (session) {
                if (session.completed) {
                    // Completed: Green dot or text
                    if (isSelected) {
                        indicator = <div className="absolute bottom-1 w-1.5 h-1.5 bg-green-400 rounded-full"></div>;
                    } else {
                        dayClass += " font-bold text-green-600 dark:text-green-400";
                        indicator = <div className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full"></div>;
                    }
                } else {
                    // Scheduled/In Progress:
                    if (isSelected) {
                        indicator = <div className="absolute bottom-1 w-1.5 h-1.5 bg-white/50 rounded-full"></div>;
                    } else {
                        dayClass += " font-semibold text-foreground";
                        indicator = <div className="absolute bottom-1 w-1.5 h-1.5 bg-foreground rounded-full"></div>;
                    }
                }
            }

            days.push(
                <button
                    key={day}
                    onClick={() => onSelectDate(date)}
                    className="flex items-center justify-center h-10 md:h-12 relative focus:outline-none w-full"
                >
                    <div className={cn(
                        "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all text-sm",
                        dayClass
                    )}>
                        <span className="z-10">{day}</span>
                        {indicator}
                    </div>
                </button>
            );
        }
        return days;
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <Card className="overflow-hidden border shadow-sm bg-background">
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="font-bold text-lg">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-full">
                        <ChevronLeft size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-full">
                        <ChevronRight size={20} />
                    </Button>
                </div>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-7 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-xs font-bold text-muted-foreground">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 place-items-center">
                    {generateCalendarDays()}
                </div>
            </div>
            <div className="p-3 bg-muted/30 border-t flex flex-wrap justify-center gap-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Completado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                    <span>Programado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Seleccionado</span>
                </div>
            </div>
        </Card>
    );
};
