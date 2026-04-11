-- ============================================================
-- Overall Dashboard — tools registry
-- ============================================================

create table public.tools (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name_ar        text not null,
  name_en        text not null,
  description_ar text,
  description_en text,
  category       text not null default 'general',
  icon           text not null default 'layout-grid',
  url            text not null,
  enabled        boolean not null default true,
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint tools_category_check check (
    category in ('analytics','hr','content','ai','social','general')
  )
);

comment on table public.tools is
  'Canonical list of tools surfaced by the Overall Dashboard.';

create index tools_enabled_position_idx
  on public.tools (enabled, position);

create trigger tools_set_updated_at
  before update on public.tools
  for each row execute function public.tg_set_updated_at();

alter table public.tools enable row level security;

revoke all on public.tools from anon;

insert into public.tools
  (slug, name_ar, name_en, description_ar, description_en, category, icon, url, position)
values
  ('commentator',
   'أداة تحليل المعلقين', 'Commentator Analysis',
   'تحليل أداء المعلقين الرياضيين عبر 32 معيارًا مهنيًا',
   'Sports commentary analysis across 32 professional criteria',
   'analytics', 'mic',
   '../Thmanyah-Commentator-Tool-claude-commentator-analysis-tool-jEEYh/index.html', 10),
  ('social-listening',
   'أداة الرصد الاجتماعي', 'Social Listening',
   'رصد المحتوى الاجتماعي وتحليل التغريدات واصطياد المرشحين',
   'Social listening, tweet analysis and candidate hunting',
   'social', 'radio',
   'http://localhost:8080', 20),
  ('chatbot',
   'مساعد ثمانية الذكي', 'Thmanyah AI Assistant',
   'دليلك الذكي للسياسات والمعلومات داخل ثمانية',
   'Internal AI assistant for policies and knowledge',
   'ai', 'message-square',
   'http://localhost:8080', 30),
  ('podcast-video',
   'أداة تحليل البودكاست', 'Podcast & Video Analysis',
   'رفع وتحليل البودكاست والفيديو وتوليد التفريغات النصية',
   'Podcast & video analysis with transcript search',
   'content', 'video',
   'http://localhost:3000', 40),
  ('hr-approval',
   'نموذج طلب فتح شاغر وظيفي', 'HR Approval Workflow',
   'إدارة طلبات فتح الوظائف الشاغرة وتوجيهها للاعتماد',
   'Hiring vacancy requests and approval workflow',
   'hr', 'clipboard-check',
   'http://localhost:3000', 50),
  ('feedback-platform',
   'منصة تحليل التقييمات', 'Feedback Analysis',
   'تحليل تقييمات الموظفين وفترات التجربة والقادة',
   'Employee, probation and leader evaluations analysis',
   'hr', 'bar-chart-3',
   'http://localhost:3000', 60);
