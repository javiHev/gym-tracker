import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { exerciseName, weight, reps, rir } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are an expert gym coach. A user just finished a set of ${exerciseName}.
      
      Performance Data:
      - Weight: ${weight} kg
      - Reps: ${reps}
      - RIR (Reps In Reserve): ${rir}

      Analyze this set. 
      - Is the weight likely appropriate?
      - Should they increase weight next time?
      - Is the RIR optimal for hypertrophy (usually 1-3)?
      
      Give a very short, concise, and motivating feedback (max 2 sentences).
      Address the user directly in Spanish.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ suggestion: text });
    } catch (error) {
        console.error("Error analyzing workout with Gemini:", error);
        return NextResponse.json({ error: "Failed to analyze workout" }, { status: 500 });
    }
}
