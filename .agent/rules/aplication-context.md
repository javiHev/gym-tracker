---
trigger: always_on
---

Perfecto, aquí tienes un **resumen compacto, estructurado y fiel** del proyecto, muy por debajo de 12k caracteres y listo para compartir como **contexto maestro** 👇

---

# 🏋️‍♂️ GYM TRACKER — Resumen del Proyecto

## 📌 Visión General

Aplicación web de seguimiento de entrenamiento en gimnasio impulsada por IA, enfocada en **sobrecarga progresiva basada en ciencia**, reducción de fricción y alta adherencia. El producto sigue la estrategia **SLC (Simple, Lovable, Complete)** para un MVP potente y diferenciador.

La IA no solo conversa: **actúa**, ajusta objetivos, crea UI y toma decisiones en tiempo real.

---

## 🎯 Propuesta de Valor

**Problema**

* Registrar entrenamientos manualmente es tedioso → abandono.
* Apps tradicionales son pasivas (solo guardan datos).

**Solución**

* Creación de rutinas mediante chat IA (no plantillas rígidas).
* Objetivos automáticos (peso, reps, RIR) con progresión inteligente.
* Seguimiento en tiempo real con feedback inmediato.
* IA proactiva que analiza rendimiento y ajusta el plan.
* UI dinámica generada/modificada por IA.

**Diferencial clave**

* Gemini + CopilotKit permiten que la IA:

  * Ejecute acciones reales (guardar, ajustar, analizar).
  * Cree/modifique componentes UI en vivo.
  * Explique el *por qué* de cada decisión.

---

## 🧠 Arquitectura de IA

* **Modelo:** Google Gemini (1.5 Pro para análisis, Flash para rapidez).
* **Framework:** CopilotKit.
* **Rol de la IA:** Entrenador invisible + copiloto activo.

### Capacidades del agente

* Crear rutinas estructuradas por conversación.
* Ajustar objetivos según progreso real.
* Analizar fatiga, RIR y consistencia.
* Generar insights y visualizaciones.
* Ejecutar acciones vía API (no solo texto).

---

## 🏗️ Stack Técnico

### Frontend

* Next.js 14 (App Router), TypeScript
* Tailwind CSS + Shadcn UI
* CopilotKit (IA → UI)
* Recharts (gráficos)

### Backend

* Supabase (PostgreSQL, Auth, Storage)
* RLS, triggers y funciones SQL

### Deploy

* Vercel (previsto)

---

## 📱 Arquitectura de Pantallas

1. **Auth**

   * Login/Signup con Supabase Auth.

2. **Onboarding (Chat IA)**

   * Usuario describe su rutina.
   * IA pregunta, genera preview visual, ajusta inline y guarda.
   * Rutina creada conversando, no rellenando formularios.

3. **Rutinas (Home)**

   * Lista de días entrenables.
   * IA contextual por día (“hoy enfócate en X”).

4. **Workout Activo**

   * Registro serie a serie.
   * Objetivos visibles (peso/reps/RIR).
   * Asistente IA flotante:

     * Feedback inmediato.
     * Ajuste de descanso.
     * Sugerencias de carga.
   * IA puede ejecutar acciones reales (log, ajustar, advertir).

5. **Celebración + Análisis**

   * Resumen del entrenamiento.
   * Análisis IA con reasoning.
   * Ajuste automático de próximos objetivos.

6. **Stats & Calendario**

   * Historial visual.
   * Insights narrados por IA (consistencia, volumen, frecuencia).

7. **Perfil**

   * Chat IA estratégico.
   * Cambios de objetivo, rutina o preferencias.

---

## 🧠 Lógica de Progresión (core)

Función `calculate_next_target()`:

* Analiza últimas 3 sesiones por ejercicio.
* Usa RIR promedio + % de cumplimiento.
* Decide:

  * Subir carga (+2.5 / +1.25 kg)
  * Mantener
  * Deload (-10%)
* Siempre devuelve **reasoning explicable**.

---

## 🗄️ Base de Datos (resumen)

Tablas clave:

* `profiles`
* `routines`, `routine_days`, `exercises`
* `workout_sessions`, `workout_logs`
* `exercise_targets_history`

Guarda:

* Objetivos IA vs logro real.
* Historial completo para análisis longitudinal.

---

## 📂 Estructura del Proyecto

* `app/` → rutas, API, pantallas
* `components/` → UI + features IA
* `lib/` → Supabase, Gemini
* `hooks/` → lógica de workout y targets
* `utils/` → progresión, prompts IA
* `types/` → Tipos Supabase + Copilot

---

## 📌 Estado del Proyecto

### ✅ Hecho

* Setup Next.js + Supabase
* Schema BD + RLS + triggers
* Lógica de progresión definida
* Estructura de carpetas

### 🔄 En progreso

* Integración CopilotKit + Gemini
* Variables de entorno
* Tipos TypeScript desde Supabase

### ⏳ Pendiente (roadmap)

1. Setup CopilotKit + endpoint `/api/copilotkit`
2. Auth completa
3. Onboarding con chat IA
4. Rutinas + workout activo
5. Análisis post-workout
6. Stats con insights
7. Perfil IA
8. Deploy

---

## 🔑 Decisiones de Diseño Clave

* IA **proactiva y accionable**, no pasiva.
* Explicabilidad obligatoria en cada sugerencia.
* Usuario siempre puede override.
* Persistencia de contexto vía CopilotKit.
* Chat solo donde aporta valor; resto UI asistida.

---

