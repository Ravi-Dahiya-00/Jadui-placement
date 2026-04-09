create table if not exists user_system_state (
  user_id text primary key,
  tasks jsonb not null default '[]'::jsonb,
  roadmap jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '[]'::jsonb,
  skill_gaps jsonb not null default '[]'::jsonb,
  chat_context jsonb not null default '{}'::jsonb,
  chat_history jsonb not null default '[]'::jsonb,
  chat_sessions jsonb not null default '[]'::jsonb,
  active_chat_session_id text not null default '',
  updated_at timestamptz not null default now()
);
