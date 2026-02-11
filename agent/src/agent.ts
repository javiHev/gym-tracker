// @ts-ignore
declare module "@copilotkit/sdk-js/langgraph";

import "dotenv/config";
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

- **create_routine**: Crea una rutina completa (nombre, descripción, días). Cada día debe tener un nombre, un número de día correlativo y una lista de ejercicios. Cada ejercicio DEBE incluir nombre, series (sets), repeticiones (reps) como string (ej: '8-12') y segundos de descanso. Úsala cuando el usuario confirme el diseño.
- **get_routines**: Consulta las rutinas existentes del usuario. Úsala ANTES de crear una rutina nueva para evitar duplicados.
- **update_routine**: Modifica nombre, descripción o estado de una rutina existente.
- **delete_routine**: Elimina una rutina permanentemente. SIEMPRE pide confirmación explícita antes de ejecutar.

## REGLAS DE COMPORTAMIENTO

1. **Sé proactivo**: Si el usuario describe sus objetivos, consulta sus rutinas actuales con get_routines antes de proponer cambios.
2. **Sé directo y profesional**: Respuestas concisas y accionables. Evita relleno.
3. **No des siempre la razón**: Si el usuario propone algo subóptimo, explica por qué y ofrece una alternativa mejor.
4. **Contrasta con datos**: Cuando el usuario tenga rutinas o historial, basa tus recomendaciones en sus datos reales.
5. **Pregunta lo necesario, no más**: Si falta información crítica, pregúntala. Con 2-3 datos clave puedes proponer algo sólido.
6. **Guarda siempre las rutinas**: Cuando diseñes una rutina, SIEMPRE usa create_routine para guardarla. ASEGÚRATE de incluir todos los ejercicios en la llamada a la herramienta. No dejes el campo de ejercicios vacío.
7. **Estructura de create_routine**: Asegúrate de que el objeto 'days' contiene el array de 'exercises' correctamente poblado según la definición de la herramienta.

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

// --- CONFIGURACIÓN DE MODELOS CON FALLBACK ---
const MODELS = [
  "gemini-3-flash-preview",     // El más potente (pero con cuota muy baja)
  "gemini-1.5-pro",             // Muy inteligente y capaz
  "gemini-2.0-flash",           // Rápido y moderno
  "gemini-2.0-flash-lite-preview-02-05", 
  "gemini-1.5-flash",           // El más estable y con mayor cuota (fallback final)
];

async function getChatModel(index = 0) {
  const modelName = MODELS[index];
  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    temperature: 0.1,
  });
}

async function chatNode(state: typeof AgentStateAnnotation.State, config: any) {
  const context = state.copilotkit?.context || [];
  const parse = (item: any) => {
    if (!item?.value) return {};
    return typeof item.value === "string" ? JSON.parse(item.value) : item.value;
  };

  const userData = parse(context.find((c: any) => c.description === "Usuario autenticado"));
  const physicalData = parse(context.find((c: any) => c.description === "Datos físicos del usuario"));
  const prefsData = parse(context.find((c: any) => c.description === "Preferencias del usuario"));

  const userId = userData.userId || "unknown";
  const userEmail = userData.email || "entrenador";

  const allTools = convertActionsToDynamicStructuredTools(state.copilotkit?.actions || []);
  
  let response;
  let lastError;

  for (let i = 0; i < MODELS.length; i++) {
    const modelName = MODELS[i];
    try {
      console.log(`\n🤖 [Agent] Intentando con: ${modelName} (Intento ${i + 1}/${MODELS.length})`);
      const model = await getChatModel(i);
      const boundModel = allTools.length > 0 ? model.bindTools(allTools) : model;

      const perfilTexto = [
        physicalData.nombre ? `Nombre: ${physicalData.nombre}` : null,
        physicalData.peso_kg ? `Peso: ${physicalData.peso_kg}kg` : null,
        physicalData.altura_cm ? `Altura: ${physicalData.altura_cm}cm` : null,
      ].filter(Boolean).join("\n- ");

      response = await boundModel.invoke([
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\n## USUARIO ACTUAL\n- userId: ${userId}\n- Email: ${userEmail}\n${perfilTexto ? `- ${perfilTexto}` : ""}\n\nUSA SIEMPRE este userId al llamar herramientas.`
        },
        ...state.messages
      ], config);
      
      console.log(`✅ [Agent] Éxito con: ${modelName}\n`);
      break; 
    } catch (err: any) {
      const isQuotaError = err.message?.includes("429") || err.message?.includes("quota");
      console.error(`⚠️ [Agent] Error en ${modelName}: ${isQuotaError ? "CUOTA EXCEDIDA" : err.message}`);
      
      lastError = err;
      if (i === MODELS.length - 1) {
        console.error("❌ [Agent] Todos los modelos han fallado.");
        throw lastError;
      }
      console.log("🔄 [Agent] Saltando al siguiente modelo...");
    }
  }

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
