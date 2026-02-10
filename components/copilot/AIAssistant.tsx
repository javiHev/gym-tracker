"use client";

import { CopilotChat } from "@copilotkit/react-ui";

export default function AIAssistant() {
  return (
    <CopilotChat
      labels={{
        title: "GRIT Coach",
        initial:
          "Soy tu GRIT Coach. Puedo ayudarte a crear rutinas, ajustar pesos, y resolver dudas sobre tu entrenamiento. ¿En qué te ayudo hoy?",
        placeholder: "Escribe tu mensaje...",
      }}
      className="h-full"
    />
  );
}
