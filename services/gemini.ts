export async function analyzeWorkoutPerformance(
    exerciseName: string,
    weight: number,
    reps: number,
    rir: number
) {
    try {
        const response = await fetch("/api/analyze-workout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ exerciseName, weight, reps, rir }),
        });

        if (!response.ok) {
            throw new Error("Failed to analyze workout");
        }

        const data = await response.json();
        return data.suggestion;
    } catch (error) {
        console.error("Error analyzing workout with Gemini Service:", error);
        return "¡Buen trabajo! Sigue así."; // Fallback
    }
}
