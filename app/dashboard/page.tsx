import { Dumbbell } from "lucide-react";
import AIAssistant from "@/components/copilot/AIAssistant";

export default function DashboardPage() {
  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col bg-white text-black">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Dumbbell className="h-6 w-6" />
        <h1 className="text-xl font-bold">GRIT</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <AIAssistant />
      </main>
    </div>
  );
}
