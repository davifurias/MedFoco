-- Etapa 3.2: tabelas do MedFoco e regras de acesso por pessoa (RLS).
-- Só ADICIONA (expandir): o app atual ainda não usa o banco.
-- Cada linha pertence a uma pessoa (user_id); ninguém acessa linhas de outra pessoa.
-- Os limites de tamanho são generosos de propósito: só barram abuso, nunca o uso normal.
-- Mapa das listas do app: docs/preparacao-fase-3.md, seção 2.

-- Tarefas
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 500),
  subject text not null default '' check (char_length(subject) <= 200),
  deadline date,
  priority text not null default 'média' check (priority in ('alta', 'média', 'baixa')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Eventos da agenda
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 500),
  date date not null,
  category text not null default 'outro'
    check (category in ('trabalho', 'provas', 'ferias', 'aulas', 'outro')),
  notes text not null default '' check (char_length(notes) <= 20000),
  created_at timestamptz not null default now()
);

-- Materiais de estudo (notas e aulas em vídeo)
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 1 and 200),
  title text not null check (char_length(btrim(title)) between 1 and 500),
  notes text not null default '' check (char_length(notes) <= 20000),
  tags text[] not null default '{}'
    check (cardinality(tags) <= 50 and char_length(array_to_string(tags, ',')) <= 5000),
  type text not null default 'nota' check (type in ('nota', 'video')),
  video_link text not null default '' check (char_length(video_link) <= 2048),
  created_at timestamptz not null default now()
);

-- Banco de questões (múltipla escolha, 4 alternativas)
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 1 and 200),
  topic text not null default '' check (char_length(topic) <= 200),
  difficulty text not null default 'médio' check (difficulty in ('fácil', 'médio', 'difícil')),
  question text not null check (char_length(btrim(question)) between 1 and 20000),
  options text[] not null
    check (cardinality(options) = 4 and char_length(array_to_string(options, '')) <= 8000),
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation text not null default '' check (char_length(explanation) <= 20000),
  created_at timestamptz not null default now()
);

-- Respostas dadas na prática (alimentam o desempenho)
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null check (char_length(subject) <= 200),
  topic text not null default '' check (char_length(topic) <= 200),
  correct boolean not null,
  date date not null,
  created_at timestamptz not null default now()
);

-- Sessões do timer de Foco (o tempo de foco nunca inclui pausas)
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('work', 'break')),
  minutes double precision not null check (minutes > 0 and minutes <= 1440),
  subject text check (char_length(subject) <= 200),
  date date not null,
  created_at timestamptz not null default now()
);

-- Caderno de Ideias (pessoal)
create table public.notebook_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 20000),
  created_at timestamptz not null default now()
);

-- Mural "Ideias do App" (decisão do dono: continua pessoal, não compartilhado)
create table public.app_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 20000),
  created_at timestamptz not null default now()
);

-- Perfil (uma linha por pessoa). Inclui horários fixos e tema. O app cria a linha ao salvar.
-- Pode conter dado de saúde em texto livre (ex.: preferências): dado sensível pela LGPD.
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  curso text not null default '' check (char_length(curso) <= 200),
  periodo text not null default '' check (char_length(periodo) <= 200),
  materias text not null default '' check (char_length(materias) <= 5000),
  metas text not null default '' check (char_length(metas) <= 5000),
  preferencias text not null default '' check (char_length(preferencias) <= 5000),
  schedule text not null default '' check (char_length(schedule) <= 20000),
  theme text not null default 'escuro' check (theme in ('escuro', 'claro')),
  created_at timestamptz not null default now()
);

-- Regras de acesso: só quem está logado, e só as próprias linhas. Visitante (anon) não acessa
-- nada. O acesso é liberado de forma explícita, tabela por tabela.
do $$
declare
  t text;
begin
  foreach t in array array[
    'tasks', 'events', 'materials', 'questions', 'attempts',
    'focus_sessions', 'notebook_entries', 'app_ideas', 'profiles'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_somente_do_dono', t
    );
    if t <> 'profiles' then
      execute format('create index %I on public.%I (user_id)', t || '_user_id_idx', t);
    end if;
  end loop;
end
$$;
