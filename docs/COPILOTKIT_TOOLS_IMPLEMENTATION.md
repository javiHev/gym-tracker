# Implementación de Tools con CopilotKit y LangChain

## 📋 Resumen

Se ha implementado un sistema completo de **CRUD de rutinas** con **feedback visual en tiempo real** usando CopilotKit y LangChain.

## 🏗️ Arquitectura

### 1. Backend Tools (LangChain)

**Ubicación**: `/agent/src/tools/routines.ts`

Se crearon 4 tools usando `DynamicStructuredTool` de LangChain:

- **`create_routine`**: Crea una rutina completa con días y ejercicios
- **`get_routines`**: Obtiene todas las rutinas del usuario
- **`update_routine`**: Actualiza datos de una rutina existente
- **`delete_routine`**: Elimina una rutina permanentemente

**Características**:
- Schemas con Zod para validación de tipos
- Llamadas a API REST para seguridad (no acceso directo a Supabase)
- Manejo de errores robusto
- Respuestas en formato JSON

### 2. API Endpoint

**Ubicación**: `/app/api/routines/route.ts`

Endpoint REST que:
- Autentica al usuario con Supabase
- Ejecuta operaciones CRUD en la base de datos
- Valida permisos (RLS)
- Retorna respuestas estructuradas

**Seguridad**:
- Autenticación obligatoria
- Validación de propiedad de rutinas
- Manejo de errores centralizado

### 3. Visual Renderers (Frontend)

**Ubicación**: `/components/routines/RoutineToolRenderers.tsx`

Componentes visuales usando `useRenderToolCall` que muestran:

#### create_routine
- Card con gradiente verde/primario
- Loader animado durante ejecución
- Preview de días y ejercicios
- Mensaje de éxito con detalles

#### update_routine
- Card naranja para actualizaciones
- Muestra campos modificados
- Confirmación visual

#### delete_routine
- Card rojo para operaciones destructivas
- Advertencia visual
- Confirmación de eliminación

#### get_routines
- Card azul para consultas
- Lista de rutinas encontradas
- Badges con información clave

**Estados visuales**:
- `executing`: Loader + mensaje "Procesando..."
- `complete`: CheckCircle + resultado exitoso
- Colores diferenciados por tipo de operación

### 4. Integración en Agent

**Ubicación**: `/agent/src/agent.ts`

El agente LangGraph ahora:
- Combina tools del frontend (CopilotKit actions) con tools del backend (routines)
- Usa `gemini-2.0-flash-exp` como modelo
- Tiene instrucciones específicas para usar las tools
- Mantiene contexto conversacional

## 🎨 Ejemplo de Uso

### Crear Rutina

```
Usuario: "Quiero una rutina Push/Pull/Legs de 6 días"

IA: [Recopila información]
    - ¿Cuál es tu nivel de experiencia?
    - ¿Qué equipamiento tienes?

Usuario: "Intermedio, tengo todo el equipo"

IA: [Llama a create_routine tool]
    → Se muestra card visual con:
      - Loader animado
      - "Creando rutina..."
      - Preview de 6 días con ejercicios
    
    → Al completar:
      - CheckCircle verde
      - "✓ Rutina 'Push/Pull/Legs' creada con 18 ejercicios en 6 días"
```

### Consultar Rutinas

```
Usuario: "¿Qué rutinas tengo?"

IA: [Llama a get_routines tool]
    → Card azul con:
      - "Consultando rutinas..."
      - Lista de rutinas encontradas
      - Badges con días y estado
```

## 🔧 Cómo Funciona

### Flujo de Creación de Rutina

1. **Usuario conversa con IA** → Recopila información
2. **IA llama tool** → `create_routine` con parámetros
3. **Tool ejecuta** → Llama a `/api/routines` con action="create_routine"
4. **API procesa** → Crea rutina en Supabase
5. **Renderer muestra** → Card visual con progreso y resultado
6. **IA responde** → Confirma creación al usuario

### Proceso Visual

```
[Usuario] → [IA/Agent] → [Tool] → [API] → [Supabase]
                ↓
         [useRenderToolCall]
                ↓
         [Visual Feedback]
```

## 📦 Archivos Creados/Modificados

### Nuevos
- `/agent/src/tools/routines.ts` - Tools de LangChain
- `/app/api/routines/route.ts` - API endpoint
- `/components/routines/RoutineToolRenderers.tsx` - Renderers visuales

### Modificados
- `/agent/src/agent.ts` - Integración de tools
- `/components/routines/RoutineCreationChat.tsx` - Integración de renderers
- `/app/routines/page.tsx` - Dialog con chat

## 🎯 Ventajas

1. **Feedback Visual Inmediato**: El usuario ve exactamente qué está haciendo la IA
2. **Seguridad**: Las tools no tienen acceso directo a Supabase
3. **Tipado Fuerte**: Zod schemas + TypeScript
4. **Extensible**: Fácil añadir más tools siguiendo el mismo patrón
5. **Human-in-the-Loop**: Confirmación visual antes de acciones destructivas

## 🚀 Próximos Pasos

1. **Añadir tools para ejercicios**:
   - `add_exercise_to_day`
   - `update_exercise`
   - `reorder_exercises`

2. **Tools para entrenamientos**:
   - `start_workout`
   - `log_set`
   - `complete_workout`

3. **Análisis y sugerencias**:
   - `analyze_progress`
   - `suggest_weight_increase`
   - `recommend_deload`

## 📝 Notas Técnicas

- Las tools usan `fetch` para llamar al API (compatible con LangGraph)
- Los renderers usan `useRenderToolCall` (hook de CopilotKit)
- El API usa `createClient` de Supabase server-side
- El agente combina tools frontend + backend en un solo array

## 🐛 Solución de Problemas

### Error: "API key not valid"
- Verificar `GEMINI_API_KEY` en `.env`
- Usar endpoint `/api/analyze-workout` para llamadas del cliente

### Error: "Unauthorized"
- Verificar autenticación de Supabase
- Comprobar que el usuario esté logueado

### Tools no se ejecutan
- Verificar que el agente LangGraph esté corriendo
- Comprobar `LANGGRAPH_DEPLOYMENT_URL` en `.env`
