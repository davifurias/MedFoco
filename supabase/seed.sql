-- Dados FICTÍCIOS para desenvolvimento local (`supabase db reset`). Nunca use dados reais aqui.
-- Duas pessoas de exemplo (sem senha: o login de teste chega na etapa 3.3).
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'ana.exemplo@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'bruno.exemplo@example.com');

insert into public.profiles (user_id, curso, periodo, materias, metas, theme) values
  ('00000000-0000-4000-8000-000000000001', 'Medicina', '3º período', 'Anatomia, Fisiologia', 'Estudar 2 horas por dia', 'escuro'),
  ('00000000-0000-4000-8000-000000000002', 'Medicina', '5º período', 'Farmacologia, Patologia', '', 'claro');

insert into public.tasks (user_id, title, subject, deadline, priority) values
  ('00000000-0000-4000-8000-000000000001', 'Revisar resumo de anatomia (exemplo)', 'Anatomia', '2026-11-10', 'alta'),
  ('00000000-0000-4000-8000-000000000002', 'Lista de exercícios (exemplo)', 'Farmacologia', null, 'média');

insert into public.events (user_id, title, date, category, notes) values
  ('00000000-0000-4000-8000-000000000001', 'Prova de Anatomia (exemplo)', '2026-11-12', 'provas', 'Capítulos 1 a 4');

insert into public.materials (user_id, subject, title, notes, tags, type) values
  ('00000000-0000-4000-8000-000000000001', 'Fisiologia', 'Ciclo cardíaco (exemplo)', 'Sístole e diástole.', array['coração', 'ciclo cardíaco'], 'nota');

insert into public.questions (user_id, subject, topic, difficulty, question, options, correct_index, explanation) values
  ('00000000-0000-4000-8000-000000000001', 'Fisiologia', 'Coração', 'fácil', 'Qual câmara bombeia sangue para o corpo? (exemplo)', array['Átrio direito', 'Ventrículo direito', 'Átrio esquerdo', 'Ventrículo esquerdo'], 3, 'O ventrículo esquerdo ejeta o sangue para a aorta.');

insert into public.attempts (user_id, subject, topic, correct, date) values
  ('00000000-0000-4000-8000-000000000001', 'Fisiologia', 'Coração', true, '2026-10-06');

insert into public.focus_sessions (user_id, type, minutes, subject, date) values
  ('00000000-0000-4000-8000-000000000001', 'work', 25, 'Anatomia', '2026-10-06');

insert into public.notebook_entries (user_id, text) values
  ('00000000-0000-4000-8000-000000000001', 'Ideia de exemplo para o caderno.');

insert into public.app_ideas (user_id, text) values
  ('00000000-0000-4000-8000-000000000002', 'Ideia de exemplo para o app.');
