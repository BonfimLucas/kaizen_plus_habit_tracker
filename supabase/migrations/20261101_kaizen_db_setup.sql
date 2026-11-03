-- ==============================================================================
-- KAIZEN+ - SCRIPT DE MIGRAÇÃO, RLS E CONFIGURAÇÃO DO BANCO SUPABASE
-- Data: 2026-11-01
-- ==============================================================================

-- 1. LIMPEZA DE TRIGGERS E FUNÇÕES LEGADAS QUE CAUSAVAM ERRO NO CADASTRO DE USUÁRIOS
-- (Remove triggers antigas que tentavam inserir na tabela inexistente dim_usuario)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_dim_usuario_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.fn_criar_dim_usuario CASCADE;

-- 2. AJUSTES DE CONSTRAINTS E IDENTIFICADORES ÚNICOS
-- Permite que user_progress, user_challenges e user_badges usem upsert seguro por usuário
ALTER TABLE public.user_progress ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_key;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_id_key UNIQUE (user_id);

ALTER TABLE public.user_challenges ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.user_challenges DROP CONSTRAINT IF EXISTS user_challenges_user_challenge_key;
ALTER TABLE public.user_challenges ADD CONSTRAINT user_challenges_user_challenge_key UNIQUE (user_id, challenge_id);

ALTER TABLE public.user_badges ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_badge_key;
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_badge_key UNIQUE (user_id, badge_id);

-- 3. FUNÇÃO E TRIGGER MODERNA PARA NOVO USUÁRIO AUTENTICADO
-- Cria automaticamente o perfil em `public.profiles` e o registro inicial em `public.user_progress`
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cria perfil do usuário
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Você'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  -- Cria registro inicial de progresso (pontos, nível, moedas zerados)
  INSERT INTO public.user_progress (id, user_id, total_points, level, coins, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    0,
    1,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Previne que qualquer exceção impeça a criação da conta em auth.users
    RAISE WARNING 'Aviso em handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Aplica o trigger em auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3. HABILITA ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)

-- 4.1 Tabela `profiles`
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4.2 Tabela `habits`
DROP POLICY IF EXISTS "habits_select_own" ON public.habits;
DROP POLICY IF EXISTS "habits_insert_own" ON public.habits;
DROP POLICY IF EXISTS "habits_update_own" ON public.habits;
DROP POLICY IF EXISTS "habits_delete_own" ON public.habits;

CREATE POLICY "habits_select_own"
  ON public.habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "habits_insert_own"
  ON public.habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits_update_own"
  ON public.habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits_delete_own"
  ON public.habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4.3 Tabela `habit_logs`
DROP POLICY IF EXISTS "habit_logs_select_own" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_insert_own" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_update_own" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_delete_own" ON public.habit_logs;

CREATE POLICY "habit_logs_select_own"
  ON public.habit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_logs.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

CREATE POLICY "habit_logs_insert_own"
  ON public.habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_logs.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

CREATE POLICY "habit_logs_update_own"
  ON public.habit_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_logs.habit_id
        AND public.habits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_logs.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

CREATE POLICY "habit_logs_delete_own"
  ON public.habit_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_logs.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

-- 4.4 Tabela `habit_goals`
DROP POLICY IF EXISTS "habit_goals_select_own" ON public.habit_goals;
DROP POLICY IF EXISTS "habit_goals_insert_own" ON public.habit_goals;
DROP POLICY IF EXISTS "habit_goals_update_own" ON public.habit_goals;
DROP POLICY IF EXISTS "habit_goals_delete_own" ON public.habit_goals;

CREATE POLICY "habit_goals_select_own"
  ON public.habit_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_goals.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

CREATE POLICY "habit_goals_insert_own"
  ON public.habit_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_goals.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

CREATE POLICY "habit_goals_update_own"
  ON public.habit_goals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_goals.habit_id
        AND public.habits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_goals.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

CREATE POLICY "habit_goals_delete_own"
  ON public.habit_goals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = public.habit_goals.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

-- 4.5 Tabela `user_progress`
DROP POLICY IF EXISTS "user_progress_select_all" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_insert_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_update_own" ON public.user_progress;

CREATE POLICY "user_progress_select_all"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_progress_insert_own"
  ON public.user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_update_own"
  ON public.user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4.6 Tabela `challenges`
DROP POLICY IF EXISTS "challenges_select_authenticated" ON public.challenges;
CREATE POLICY "challenges_select_authenticated"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (true);

-- 4.7 Tabela `user_challenges`
DROP POLICY IF EXISTS "user_challenges_select_own" ON public.user_challenges;
DROP POLICY IF EXISTS "user_challenges_insert_own" ON public.user_challenges;
DROP POLICY IF EXISTS "user_challenges_update_own" ON public.user_challenges;
DROP POLICY IF EXISTS "user_challenges_delete_own" ON public.user_challenges;

CREATE POLICY "user_challenges_select_own"
  ON public.user_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_challenges_insert_own"
  ON public.user_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_challenges_update_own"
  ON public.user_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_challenges_delete_own"
  ON public.user_challenges FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4.8 Tabela `badges`
DROP POLICY IF EXISTS "badges_select_authenticated" ON public.badges;
CREATE POLICY "badges_select_authenticated"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

-- 4.9 Tabela `user_badges`
DROP POLICY IF EXISTS "user_badges_select_own" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_insert_own" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_update_own" ON public.user_badges;

CREATE POLICY "user_badges_select_own"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_badges_insert_own"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_badges_update_own"
  ON public.user_badges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. ÍNDICES DE DESEMPENHO E CONSULTA
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_at ON public.habit_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_habit_goals_habit_id ON public.habit_goals(habit_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- 6. DADOS INICIAIS (SEED) COERENTES COM O KAIZEN+
-- Desafios Oficiais
INSERT INTO public.challenges (id, name, description, start_date, points_reward, is_active, created_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001', '7 dias consecutivos', 'Complete 7 dias seguidos de hábitos.', CURRENT_DATE, 150, true, NOW()),
  ('c1000000-0000-0000-0000-000000000002', 'Beber água por 5 dias', 'Beba água por 5 dias esta semana.', CURRENT_DATE, 100, true, NOW()),
  ('c1000000-0000-0000-0000-000000000003', 'Estudar por 7 dias', 'Estude por 7 dias esta semana.', CURRENT_DATE, 150, true, NOW())
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  points_reward = EXCLUDED.points_reward,
  is_active = EXCLUDED.is_active;

-- Medalhas / Insígnias Oficiais
INSERT INTO public.badges (id, name, description, criteria, icon_url, created_at)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Insígnia "Constante"', 'Complete 7 dias consecutivos.', 'streak_7', 'shield', NOW()),
  ('b1000000-0000-0000-0000-000000000002', 'Insígnia "Focado"', 'Complete 14 dias consecutivos.', 'streak_14', 'lock', NOW()),
  ('b1000000-0000-0000-0000-000000000003', '250 moedas', 'Complete 10 desafios.', 'challenges_10', 'coins', NOW())
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  criteria = EXCLUDED.criteria,
  icon_url = EXCLUDED.icon_url;

