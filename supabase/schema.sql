-- ============================================
-- GYM TRACKER - DATABASE SCHEMA v2
-- Con sistema de objetivos inteligente
-- ============================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos personales
  full_name TEXT,
  avatar_url TEXT,
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  birth_date DATE,
  
  -- Preferencias
  units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  
  -- Notificaciones
  notifications_enabled BOOLEAN DEFAULT true,
  timer_sound_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- ============================================
-- TABLA: routines
-- ============================================
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Info básica
  name TEXT NOT NULL,
  description TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_active ON routines(user_id, is_active) WHERE is_active = true;

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can view own routines') THEN
        CREATE POLICY "Users can view own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can insert own routines') THEN
        CREATE POLICY "Users can insert own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can update own routines') THEN
        CREATE POLICY "Users can update own routines" ON routines FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can delete own routines') THEN
        CREATE POLICY "Users can delete own routines" ON routines FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- TABLA: routine_days
-- ============================================
CREATE TABLE IF NOT EXISTS routine_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  
  -- Info del día
  name TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_day_number_per_routine UNIQUE (routine_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_routine_days_routine_id ON routine_days(routine_id);

ALTER TABLE routine_days ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_days' AND policyname = 'Users can view days of own routines') THEN
        CREATE POLICY "Users can view days of own routines" ON routine_days FOR SELECT USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_days' AND policyname = 'Users can insert days in own routines') THEN
        CREATE POLICY "Users can insert days in own routines" ON routine_days FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.user_id = auth.uid()));
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_days' AND policyname = 'Users can update days of own routines') THEN
        CREATE POLICY "Users can update days of own routines" ON routine_days FOR UPDATE USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_days' AND policyname = 'Users can delete days of own routines') THEN
        CREATE POLICY "Users can delete days of own routines" ON routine_days FOR DELETE USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_days.routine_id AND routines.user_id = auth.uid()));
    END IF;
END $$;

-- ============================================
-- TABLA: exercises (CON OBJETIVOS)
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_day_id UUID NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
  
  -- Info del ejercicio
  name TEXT NOT NULL,
  
  -- Configuración base (lo que puso el usuario inicialmente)
  base_sets INTEGER NOT NULL,
  base_reps TEXT NOT NULL,
  
  -- OBJETIVOS ACTUALES (calculados por IA, modificables por usuario)
  target_weight_kg DECIMAL(6,2),
  target_sets INTEGER,
  target_reps TEXT,
  target_rir INTEGER CHECK (target_rir BETWEEN 0 AND 10),
  
  -- Orden y timing
  order_index INTEGER NOT NULL,
  rest_seconds INTEGER DEFAULT 120,
  
  -- Notas del ejercicio
  notes TEXT,
  
  -- Control de actualización de objetivos
  last_target_update TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_order_per_day UNIQUE (routine_day_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_exercises_routine_day_id ON exercises(routine_day_id);
CREATE INDEX IF NOT EXISTS idx_exercises_order ON exercises(routine_day_id, order_index);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercises' AND policyname = 'Users can view exercises of own routine days') THEN
        CREATE POLICY "Users can view exercises of own routine days" ON exercises FOR SELECT USING (EXISTS (SELECT 1 FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE rd.id = exercises.routine_day_id AND r.user_id = auth.uid()));
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercises' AND policyname = 'Users can insert exercises in own routine days') THEN
        CREATE POLICY "Users can insert exercises in own routine days" ON exercises FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE rd.id = exercises.routine_day_id AND r.user_id = auth.uid()));
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercises' AND policyname = 'Users can update exercises of own routine days') THEN
        CREATE POLICY "Users can update exercises of own routine days" ON exercises FOR UPDATE USING (EXISTS (SELECT 1 FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE rd.id = exercises.routine_day_id AND r.user_id = auth.uid()));
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercises' AND policyname = 'Users can delete exercises of own routine days') THEN
        CREATE POLICY "Users can delete exercises of own routine days" ON exercises FOR DELETE USING (EXISTS (SELECT 1 FROM routine_days rd JOIN routines r ON r.id = rd.routine_id WHERE rd.id = exercises.routine_day_id AND r.user_id = auth.uid()));
    END IF;
END $$;

-- ============================================
-- TABLA: workout_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_day_id UUID REFERENCES routine_days(id) ON DELETE SET NULL,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Estado
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  -- Métricas calculadas
  duration_minutes INTEGER,
  total_volume_kg DECIMAL(10,2) DEFAULT 0,
  
  -- Evaluación general de la sesión
  overall_feeling TEXT CHECK (overall_feeling IN ('excellent', 'good', 'normal', 'tired', 'poor')),
  
  -- Notas de la sesión
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_routine_day ON workout_sessions(routine_day_id);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_sessions' AND policyname = 'Users can view own workout sessions') THEN
        CREATE POLICY "Users can view own workout sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_sessions' AND policyname = 'Users can insert own workout sessions') THEN
        CREATE POLICY "Users can insert own workout sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_sessions' AND policyname = 'Users can update own workout sessions') THEN
        CREATE POLICY "Users can update own workout sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_sessions' AND policyname = 'Users can delete own workout sessions') THEN
        CREATE POLICY "Users can delete own workout sessions" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- TABLA: workout_logs (CON RIR Y SENSACIONES)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Datos de la serie - LOGRO REAL
  set_number INTEGER NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  reps_completed INTEGER NOT NULL,
  
  -- RIR y sensaciones
  rir INTEGER CHECK (rir BETWEEN 0 AND 10),
  feeling TEXT CHECK (feeling IN ('strong', 'normal', 'tired', 'weak')),
  
  -- Notas específicas de esta serie
  notes TEXT,
  
  -- Timing
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_set_per_exercise UNIQUE (workout_session_id, exercise_id, set_number)
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_session ON workout_logs(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise ON workout_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(logged_at DESC);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'Users can view own workout logs') THEN
        CREATE POLICY "Users can view own workout logs" ON workout_logs FOR SELECT USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_logs.workout_session_id AND ws.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'Users can insert own workout logs') THEN
        CREATE POLICY "Users can insert own workout logs" ON workout_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_logs.workout_session_id AND ws.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'Users can update own workout logs') THEN
        CREATE POLICY "Users can update own workout logs" ON workout_logs FOR UPDATE USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_logs.workout_session_id AND ws.user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'Users can delete own workout logs') THEN
        CREATE POLICY "Users can delete own workout logs" ON workout_logs FOR DELETE USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_logs.workout_session_id AND ws.user_id = auth.uid()));
    END IF;
END $$;

-- ============================================
-- TABLA: exercise_targets_history
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_targets_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Objetivo establecido
  target_weight_kg DECIMAL(6,2),
  target_sets INTEGER,
  target_reps TEXT,
  target_rir INTEGER,
  
  -- Contexto
  set_by TEXT DEFAULT 'ai' CHECK (set_by IN ('ai', 'user')),
  reason TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_targets_history_exercise ON exercise_targets_history(exercise_id);
CREATE INDEX IF NOT EXISTS idx_targets_history_date ON exercise_targets_history(created_at DESC);

ALTER TABLE exercise_targets_history ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercise_targets_history' AND policyname = 'Users can view targets history of own exercises') THEN
        CREATE POLICY "Users can view targets history of own exercises" ON exercise_targets_history FOR SELECT USING (EXISTS (SELECT 1 FROM exercises e JOIN routine_days rd ON rd.id = e.routine_day_id JOIN routines r ON r.id = rd.routine_id WHERE e.id = exercise_targets_history.exercise_id AND r.user_id = auth.uid()));
    END IF;
END $$;
