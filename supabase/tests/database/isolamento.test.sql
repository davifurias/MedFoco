-- Testes de isolamento (pgTAP): a pessoa A nunca lê, grava nem apaga dado da pessoa B,
-- e quem não está logado não acessa nada. Rodam no CI (`supabase test db`).
-- Tudo acontece numa transação que é desfeita no fim: nada fica gravado.
begin;
select * from no_plan();

-- Ajudantes (existem só durante este teste). Executam com os poderes de quem chamou.
create function public.__t_count(tbl text) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute format('select count(*) from public.%I', tbl) into n;
  return n;
end $f$;

create function public.__t_update_others(tbl text, victim uuid) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute format('with u as (update public.%I set user_id = user_id where user_id = %L returning 1) select count(*) from u', tbl, victim) into n;
  return n;
end $f$;

create function public.__t_delete_others(tbl text, victim uuid) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute format('with d as (delete from public.%I where user_id = %L returning 1) select count(*) from d', tbl, victim) into n;
  return n;
end $f$;

-- Copia uma linha própria para outro dono (deve ser barrado pelas regras de acesso).
create function public.__t_insert_as(tbl text, owner uuid) returns void language plpgsql as $f$
begin
  execute format(
    'insert into public.%1$I select (jsonb_populate_record(null::public.%1$I, '
    || 'to_jsonb(r) || jsonb_build_object(''user_id'', %2$L, ''id'', gen_random_uuid()))).* '
    || 'from public.%1$I r where r.user_id = auth.uid() limit 1', tbl, owner);
end $f$;

-- Passa a agir como a pessoa indicada (como o login faria).
create function public.__t_as(uid uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $f$;

-- Estrutura: todas as tabelas conhecidas, todas com RLS ligado e nenhuma liberada ao visitante.
select is(
  (select array_agg(tablename::text order by tablename) from pg_tables where schemaname = 'public'),
  array['app_ideas','attempts','events','focus_sessions','materials','notebook_entries','profiles','questions','tasks'],
  'tabelas do schema public (se criar uma nova, inclua aqui e nas regras de acesso)'
);
select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'toda tabela do schema public tem RLS ligado'
);
select is(
  (select count(*) from pg_tables
    where schemaname = 'public'
      and has_table_privilege('anon', format('public.%I', tablename), 'select,insert,update,delete,truncate,references,trigger')),
  0::bigint,
  'visitante (anon) não tem acesso a nenhuma tabela'
);

-- Duas pessoas fictícias.
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a.teste@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b.teste@example.com');

-- A cria uma linha em cada tabela (sem informar o dono: o banco usa quem está logado).
select public.__t_as('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.tasks (title) values ('tarefa de A');
insert into public.events (title, date) values ('evento de A', '2026-10-07');
insert into public.materials (subject, title) values ('Cardiologia', 'material de A');
insert into public.questions (subject, question, options, correct_index)
  values ('Cardiologia', 'pergunta de A', array['1','2','3','4'], 2);
insert into public.attempts (subject, correct, date) values ('Cardiologia', true, '2026-10-07');
insert into public.focus_sessions (type, minutes, date) values ('work', 25, '2026-10-07');
insert into public.notebook_entries (text) values ('caderno de A');
insert into public.app_ideas (text) values ('ideia de A');
insert into public.profiles (curso) values ('Medicina A');
select is(public.__t_count('tasks'), 1::bigint, 'A enxerga a própria tarefa');
reset role;

-- B cria uma linha em cada tabela.
select public.__t_as('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.tasks (title) values ('tarefa de B');
insert into public.events (title, date) values ('evento de B', '2026-10-08');
insert into public.materials (subject, title) values ('Pneumologia', 'material de B');
insert into public.questions (subject, question, options, correct_index)
  values ('Pneumologia', 'pergunta de B', array['1','2','3','4'], 1);
insert into public.attempts (subject, correct, date) values ('Pneumologia', false, '2026-10-08');
insert into public.focus_sessions (type, minutes, date) values ('break', 5, '2026-10-08');
insert into public.notebook_entries (text) values ('caderno de B');
insert into public.app_ideas (text) values ('ideia de B');
insert into public.profiles (curso) values ('Medicina B');

-- B só enxerga as próprias linhas e não consegue mexer nas de A.
select is(public.__t_count(t), 1::bigint, 'B enxerga só 1 linha (a dele) em ' || t)
  from unnest(array['tasks','events','materials','questions','attempts','focus_sessions','notebook_entries','app_ideas','profiles']) as t;
select is(public.__t_update_others(t, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0::bigint, 'B não altera dado de A em ' || t)
  from unnest(array['tasks','events','materials','questions','attempts','focus_sessions','notebook_entries','app_ideas','profiles']) as t;
select is(public.__t_delete_others(t, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0::bigint, 'B não apaga dado de A em ' || t)
  from unnest(array['tasks','events','materials','questions','attempts','focus_sessions','notebook_entries','app_ideas','profiles']) as t;
select throws_ok(
  format('select public.__t_insert_as(%L, %L)', t, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  '42501', null, 'B não grava em nome de A em ' || t)
  from unnest(array['tasks','events','materials','questions','attempts','focus_sessions','notebook_entries','app_ideas','profiles']) as t;
select throws_ok(
  format('update public.%I set user_id = %L where user_id = auth.uid()', t, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  '42501', null, 'B não passa uma linha dele para A em ' || t)
  from unnest(array['tasks','events','materials','questions','attempts','focus_sessions','notebook_entries','app_ideas','profiles']) as t;
reset role;

-- A continua com tudo intacto depois das tentativas de B.
select public.__t_as('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select is(public.__t_count(t), 1::bigint, 'A continua com a própria linha em ' || t)
  from unnest(array['tasks','events','materials','questions','attempts','focus_sessions','notebook_entries','app_ideas','profiles']) as t;
reset role;

-- Visitante sem login: nenhuma tabela é acessível.
set local role anon;
select throws_ok(format('select count(*) from public.%I', t), '42501', null, 'visitante não lê ' || t)
  from unnest(array['tasks','events','materials','questions','attempts','focus_sessions','notebook_entries','app_ideas','profiles']) as t;
reset role;

-- Validações do banco: dado malformado é barrado.
select public.__t_as('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select throws_ok($$insert into public.tasks (title, priority) values ('x', 'urgente')$$, '23514', null, 'prioridade inválida é barrada');
select throws_ok($$insert into public.tasks (title) values ('   ')$$, '23514', null, 'título em branco é barrado');
select throws_ok($$insert into public.questions (subject, question, options, correct_index) values ('s', 'q', array['1','2','3'], 0)$$, '23514', null, 'questão com 3 alternativas é barrada');
select throws_ok($$insert into public.questions (subject, question, options, correct_index) values ('s', 'q', array['1','2','3','4'], 4)$$, '23514', null, 'resposta correta fora de 0 a 3 é barrada');
select throws_ok($$insert into public.focus_sessions (type, minutes, date) values ('work', 0, '2026-10-07')$$, '23514', null, 'foco com 0 minuto é barrado');
select throws_ok($$insert into public.profiles (theme) values ('azul')$$, '23514', null, 'tema inválido é barrado');
reset role;

select * from finish();
rollback;
