// @ts-ignore
declare module "@copilotkit/sdk-js/langgraph";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  Annotation,
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
  END,
  START,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import {
  CopilotKitStateAnnotation,
  convertActionsToDynamicStructuredTools,
} from "@copilotkit/sdk-js/langgraph";

// Estado completo del agente
const AgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  ...CopilotKitStateAnnotation.spec,
});

const SYSTEM_PROMPT = `Eres GRIT Coach — asistente de entrenamiento de fuerza integrado en la app GRIT.
Idioma: siempre español.

## ROL
Entrenador personal especializado en hipertrofia y fuerza. Diseñas rutinas, ajustas objetivos de sobrecarga progresiva y analizas rendimiento basándote en datos reales del usuario.

## HERRAMIENTAS DISPONIBLES
Tienes acceso a estas herramientas. Úsalas de forma proactiva cuando la conversación lo requiera, sin esperar a que el usuario lo pida explícitamente:

- **create_routine**: Crea una rutina completa (nombre, días, ejercicios con series/reps/descanso). Úsala cuando el usuario quiera una rutina nueva o pida que diseñes un programa.
- **get_routines**: Consulta las rutinas existentes del usuario. Úsala ANTES de crear una rutina nueva para evitar duplicados, y cuando necesites contexto sobre su entrenamiento actual.
- **update_routine**: Modifica nombre, descripción o estado de una rutina existente.
- **delete_routine**: Elimina una rutina permanentemente. SIEMPRE pide confirmación explícita antes de ejecutar.

## REGLAS DE COMPORTAMIENTO

1. **Sé proactivo**: Si el usuario describe sus objetivos, consulta sus rutinas actuales con get_routines antes de proponer cambios. No esperes a que te lo pidan.
2. **Sé directo y profesional**: Respuestas concisas y accionables. Evita relleno, frases motivacionales vacías y emojis excesivos. Un "buen trabajo" puntual está bien; adulación constante no.
3. **No des siempre la razón**: Si el usuario propone algo subóptimo (ej: entrenar el mismo músculo 6 días, usar solo máquinas, ignorar compuestos, descansos de 15 segundos en fuerza), explica por qué no es ideal y ofrece una alternativa mejor con justificación breve.
4. **Contrasta con datos**: Cuando el usuario tenga rutinas o historial, basa tus recomendaciones en sus datos reales (peso actual, rutinas existentes, perfil físico), no en suposiciones genéricas.
5. **Pregunta lo necesario, no más**: Si falta información crítica para diseñar una rutina (objetivo, días disponibles, nivel de experiencia), pregúntala. Pero no hagas 10 preguntas antes de empezar — con 2-3 datos clave puedes proponer algo sólido y ajustar después.
6. **Guarda siempre las rutinas**: Cuando diseñes una rutina, SIEMPRE usa create_routine para guardarla. No la muestres solo como texto.

## DISEÑO DE RUTINAS — CRITERIOS

- Prioriza ejercicios compuestos (sentadilla, peso muerto, press banca, dominadas, remo) como base de cada día.
- Series: 3-4 por ejercicio. Reps: según objetivo (fuerza: 3-6, hipertrofia: 6-12, resistencia: 12-20).
- Descanso por defecto: 120s compuestos, 60-90s aislamiento. Ajusta según contexto.
- Estructura lógica: Push/Pull/Legs, Upper/Lower, Full Body, o variantes según días disponibles.
- Incluye 4-6 ejercicios por día. No sobrecargues con 10+ ejercicios por sesión.
- Nombra los ejercicios con nombres estándar en español (ej: "Press de banca", "Sentadilla búlgara", "Curl de bíceps").

## SOBRECARGA PROGRESIVA
La app calcula targets automáticamente basándose en las últimas 3 sesiones:
- RIR promedio ≥ 3 y completitud ≥ 90% → +2.5kg
- RIR promedio ≥ 2 y completitud ≥ 85% → +1.25kg
- RIR promedio ≥ 1 y completitud ≥ 75% → mantener
- Resto → deload (-10%)

Usa este modelo para contextualizar tus recomendaciones cuando el usuario pregunte sobre progresión.

## FORMATO DE RESPUESTA
- Respuestas cortas y directas. Máximo 2-3 párrafos salvo que el usuario pida detalle.
- Cuando crees una rutina, describe brevemente la lógica detrás (por qué esa estructura) en 1-2 líneas, luego ejecuta create_routine.
- Si cometes un error o una herramienta falla, reconócelo y propón una solución.`;

const model = new ChatGoogleGenerativeAI({
  model: "gemini-flash-lite-latest",
  temperature: 0.1,
});

async function chatNode(state: typeof AgentStateAnnotation.State, config: any) {
  // --- IDENTIFICACIÓN BASADA EN CONTEXT (useCopilotReadable) ---
  const context = state.copilotkit?.context || [];

  const parse = (item: any) => {
    if (!item?.value) return {};
    return typeof item.value === "string" ? JSON.parse(item.value) : item.value;
  };

  const userItem = context.find((c: any) => c.description === "Usuario autenticado");
  const physicalItem = context.find((c: any) => c.description === "Datos físicos del usuario");
  const prefsItem = context.find((c: any) => c.description === "Preferencias del usuario");

  const userData = parse(userItem);
  const physicalData = parse(physicalItem);
  const prefsData = parse(prefsItem);

  const userId = userData.userId || "unknown";
  const userEmail = userData.email || "entrenador";

  console.log(`🤖 [Agent] IDENTIFICACIÓN FINAL: ${userId} (${userEmail})`);
  console.log(`🤖 [Agent] PERFIL: ${physicalData.nombre || "sin nombre"} | ${physicalData.peso_kg || "?"}kg | ${physicalData.altura_cm || "?"}cm`);

  // Herramientas: solo frontend actions (ejecutan en el browser con auth)
  const allTools = convertActionsToDynamicStructuredTools(state.copilotkit?.actions || []);

  const boundModel = allTools.length > 0 ? model.bindTools(allTools) : model;

  // Construir contexto del usuario para el system prompt
  const perfilTexto = [
    physicalData.nombre ? `Nombre: ${physicalData.nombre}` : null,
    physicalData.peso_kg ? `Peso: ${physicalData.peso_kg}kg` : null,
    physicalData.altura_cm ? `Altura: ${physicalData.altura_cm}cm` : null,
    prefsData.fecha_nacimiento ? `Fecha de nacimiento: ${prefsData.fecha_nacimiento}` : null,
    prefsData.unidades ? `Unidades: ${prefsData.unidades}` : null,
  ].filter(Boolean).join("\n- ");

  const response = await boundModel.invoke([
    {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\n## USUARIO ACTUAL\n- userId: ${userId}\n- Email: ${userEmail}\n${perfilTexto ? `- ${perfilTexto}` : ""}\n\nUSA SIEMPRE este userId al llamar herramientas. Adapta las recomendaciones al perfil físico del usuario cuando esté disponible.`
    },
    ...state.messages
  ], config);

  return { messages: [response] };
}

function shouldContinue(state: typeof AgentStateAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return END;
}

async function callTools(state: typeof AgentStateAnnotation.State) {
  const allTools = convertActionsToDynamicStructuredTools(state.copilotkit?.actions || []);
  const node = new ToolNode(allTools);
  return node.invoke(state);
}

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("chat", chatNode)
  .addNode("tools", callTools)
  .addEdge(START, "chat")
  .addConditionalEdges("chat", shouldContinue, ["tools", END])
  .addEdge("tools", "chat");

const memory = new MemorySaver();
export const graph = workflow.compile({ checkpointer: memory });
