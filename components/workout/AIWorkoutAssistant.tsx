"use client";

import React, { useState, useEffect } from "react";
import { Bot, X, Check, MessageSquare } from "lucide-react";
import { analyzeWorkoutPerformance } from "@/services/gemini";
import { useCopilotContext } from "@copilotkit/react-core";
import { cn } from "@/lib/utils";

interface AIWorkoutAssistantProps {
    lastLog?: { weight: number; reps: number; rir: number; exerciseName: string };
}

export const AIWorkoutAssistant: React.FC<AIWorkoutAssistantProps> = ({ lastLog }) => {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    useEffect(() => {
        if (lastLog) {
            setIsOpen(true);
            setIsAnalyzing(true);
            analyzeWorkoutPerformance(lastLog.exerciseName, lastLog.weight, lastLog.reps, lastLog.rir)
                .then(text => {
                    setSuggestion(text);
                    setIsAnalyzing(false);
                });
        }
    }, [lastLog]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-12 h-12 bg-black rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:bg-zinc-800 transition-all border border-zinc-800"
            >
                <Bot className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="w-full md:w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-zinc-900 p-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Bot className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">AI Copilot</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4">
                {isAnalyzing ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4"></div>
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2"></div>
                    </div>
                ) : suggestion ? (
                    <>
                        <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-4 leading-relaxed">
                            {suggestion}
                        </p>
                        <div className="flex gap-2">
                            <button className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium py-2 px-3 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center gap-1 border border-zinc-200 dark:border-zinc-700">
                                <Check className="w-3 h-3" /> Apply
                            </button>
                            <button className="flex-1 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 text-xs font-medium py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center gap-1 border border-zinc-200 dark:border-zinc-800">
                                <MessageSquare className="w-3 h-3" /> Discuss
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-zinc-500 text-sm italic">
                        Realiza una serie para que pueda analizar tu rendimiento.
                    </p>
                )}
            </div>
        </div>
    );
};
