-- Seed chatbot + social_listening demo data. Idempotent via uuid PKs +
-- NOT EXISTS guards.

-- ── chatbot: documents, chunks, conversations, messages, logs ──
insert into chatbot.documents (id, title, file_name, file_path, access_tier, metadata, sections, status) values
  ('11111111-1111-1111-1111-111111111111','دليل الموظف — ثمانية','employee-handbook-2026.pdf','/docs/employee-handbook-2026.pdf','public',
   '{"department":"الموارد البشرية","version":"2026.1","pages":42}'::jsonb,
   '[{"title":"الثقافة والقيم"},{"title":"الإجازات والدوام"},{"title":"الصحة والتأمين"},{"title":"التطوير المهني"}]'::jsonb,'processed'),
  ('22222222-2222-2222-2222-222222222222','سياسة الترقيات والمسارات الوظيفية','promotion-policy-2026.pdf','/docs/promotion-policy-2026.pdf','internal',
   '{"department":"الموارد البشرية","version":"2026.1","pages":18}'::jsonb,
   '[{"title":"مستويات الوظائف L1-L8"},{"title":"معايير الترقية"},{"title":"دورة المراجعة"}]'::jsonb,'processed'),
  ('33333333-3333-3333-3333-333333333333','كتيّب التوجيه — Onboarding','onboarding-kit-2026.pdf','/docs/onboarding-kit-2026.pdf','public',
   '{"department":"الموارد البشرية","version":"2026.1","pages":28}'::jsonb,
   '[{"title":"الأسبوع الأول"},{"title":"اللقاءات الرسمية"},{"title":"المسؤوليات والأهداف"}]'::jsonb,'processed')
on conflict (id) do nothing;

insert into chatbot.document_chunks (document_id, content, section_title, chunk_index, metadata)
select * from (values
  ('11111111-1111-1111-1111-111111111111'::uuid,'ثقافتنا على خمس قيم: الشفافية، التمكين، الحرفية، المسؤولية، الابتكار.','الثقافة والقيم',0,'{"page":3}'::jsonb),
  ('11111111-1111-1111-1111-111111111111'::uuid,'الإجازة السنوية 22 يوم. ترحيل حتى 10 أيام بعد موافقة المدير. المرضية حتى 30 يوماً بشهادة.','الإجازات والدوام',1,'{"page":12}'::jsonb),
  ('11111111-1111-1111-1111-111111111111'::uuid,'تأمين صحي شامل عبر Bupa Arabia فئة أ للموظف وعائلته.','الصحة والتأمين',2,'{"page":18}'::jsonb),
  ('11111111-1111-1111-1111-111111111111'::uuid,'ميزانية تطوير مهني 8000 ريال سنوياً لكل موظف.','التطوير المهني',3,'{"page":26}'::jsonb),
  ('22222222-2222-2222-2222-222222222222'::uuid,'المستويات L1 إلى L8، كل مستوى له مجال تأثير ومسؤولية.','مستويات الوظائف L1-L8',0,'{"page":2}'::jsonb),
  ('22222222-2222-2222-2222-222222222222'::uuid,'الترقية تتطلب: A- لربعين متتاليين، تأثير 6 أشهر، توصية القائد.','معايير الترقية',1,'{"page":7}'::jsonb),
  ('22222222-2222-2222-2222-222222222222'::uuid,'دورة المراجعة ربعية، القرارات النهائية Q2 و Q4 فقط.','دورة المراجعة',2,'{"page":14}'::jsonb),
  ('33333333-3333-3333-3333-333333333333'::uuid,'الأسبوع الأول: ترحيب مع CEO، إعداد تقني، لقاءات 1:1، دليل الموظف.','الأسبوع الأول',0,'{"page":2}'::jsonb),
  ('33333333-3333-3333-3333-333333333333'::uuid,'الشهر الأول: أهداف 30/60/90، جلسة HR، جلسة ثقافة.','اللقاءات الرسمية',1,'{"page":8}'::jsonb),
  ('33333333-3333-3333-3333-333333333333'::uuid,'90 يوم الأولى: تعلّم، شبكة، مساهمة ملموسة.','المسؤوليات والأهداف',2,'{"page":15}'::jsonb)
) as x(document_id, content, section_title, chunk_index, metadata)
where not exists (
  select 1 from chatbot.document_chunks c
  where c.document_id = x.document_id and c.chunk_index = x.chunk_index
);

insert into chatbot.conversations (id, title, access_tier) values
  ('44444444-4444-4444-4444-444444444444','إجازاتي ورصيدها','public'),
  ('55555555-5555-5555-5555-555555555555','ترقية L5 — ما المطلوب؟','internal')
on conflict (id) do nothing;

insert into chatbot.messages (conversation_id, role, content, citations)
select * from (values
  ('44444444-4444-4444-4444-444444444444'::uuid,'user','كم رصيد إجازتي السنوي؟','[]'::jsonb),
  ('44444444-4444-4444-4444-444444444444'::uuid,'assistant','22 يوم عمل. ترحيل حتى 10 أيام.','[{"document":"دليل الموظف","page":12}]'::jsonb),
  ('44444444-4444-4444-4444-444444444444'::uuid,'user','وماذا عن الإجازة المرضية؟','[]'::jsonb),
  ('44444444-4444-4444-4444-444444444444'::uuid,'assistant','حتى 30 يوماً مدفوعة بشهادة طبية.','[{"document":"دليل الموظف","page":12}]'::jsonb),
  ('55555555-5555-5555-5555-555555555555'::uuid,'user','ما هي معايير ترقية L5؟','[]'::jsonb),
  ('55555555-5555-5555-5555-555555555555'::uuid,'assistant','A- لربعين + تأثير 6 أشهر + توصية. قرارات Q2/Q4.','[{"document":"سياسة الترقيات","page":7}]'::jsonb)
) as x(conversation_id, role, content, citations)
where not exists (
  select 1 from chatbot.messages m
  where m.conversation_id = x.conversation_id and m.content = x.content and m.role = x.role
);

insert into chatbot.query_logs (question, answer, document_source, access_tier)
select * from (values
  ('كم رصيد إجازتي السنوي؟','22 يوم عمل، ترحيل 10 أيام.','employee-handbook-2026.pdf','public'),
  ('ما هي معايير الترقية؟','A- لربعين متتاليين وتأثير 6 أشهر.','promotion-policy-2026.pdf','internal'),
  ('ماذا يحدث في أسبوعي الأول؟','ترحيب، إعداد تقني، لقاءات، دليل الموظف.','onboarding-kit-2026.pdf','public'),
  ('هل التأمين يشمل الطب النفسي؟','نعم، عبر Bupa Arabia فئة أ.','employee-handbook-2026.pdf','public'),
  ('كم ميزانية التطوير المهني؟','8000 ريال سنوياً.','employee-handbook-2026.pdf','public')
) as x(question, answer, document_source, access_tier)
where not exists (
  select 1 from chatbot.query_logs q where q.question = x.question
);

-- ── social_listening: tweet analyses, commentary, candidates ──
insert into social_listening.tweet_analyses
  (search_terms, max_items, sort_order, total_tweets, positive_count, negative_count, neutral_count,
   insights, recommendations, sample_tweets, all_tweets, main_issues)
select * from (values
  (array['ثمانية','بودكاست ثمانية','Thmanyah'], 100, 'Latest', 120, 78, 12, 30,
   'غالبية التغريدات إيجابية. طلب حلقات أطول وبصوت أفضل.',
   'استثمار في جودة الصوت، ضيوف دوليون، Apple Podcasts Connect.',
   '[{"author":"@fan1","text":"أحسن برنامج عربي","sentiment":"positive"}]'::jsonb,
   '[]'::jsonb, 'شكاوى جودة صوت'),
  (array['دوري روشن','الهلال','النصر'], 150, 'Top', 210, 95, 78, 37,
   'استقطاب بين الهلال والنصر. شكاوى تعليق رياضي.',
   'تدريب المعلقين على الحياد.',
   '[{"author":"@hilal_fan","text":"تحكيم غريب","sentiment":"negative"}]'::jsonb,
   '[]'::jsonb, 'التحكيم والتعليق'),
  (array['رؤية 2030','ريادة أعمال'], 80, 'Top', 92, 74, 4, 14,
   'إيجابية عالية تجاه 2030.','قصص نجاح رواد أعمال.',
   '[{"author":"@starter1","text":"منشآت غيّرت حياتي","sentiment":"positive"}]'::jsonb,'[]'::jsonb, null),
  (array['ذكاء اصطناعي','AI'], 120, 'Latest', 145, 82, 15, 48,
   'اهتمام متزايد وخوف وظيفي هادئ.','سلسلة تعليمية عربية.',
   '[{"author":"@ai_curious","text":"AI قادم","sentiment":"neutral"}]'::jsonb,'[]'::jsonb,'قلق وظيفي'),
  (array['سوالف بزنس'], 60, 'Top', 68, 55, 3, 10,
   'برنامج محبوب، طلب ضيوف محددين.','ضيوف خارج التقنية.',
   '[{"author":"@fan2","text":"ضيف ممتاز","sentiment":"positive"}]'::jsonb,'[]'::jsonb, null),
  (array['ثقافة شركات'], 40, 'Latest', 52, 36, 6, 10,
   'ثمانية كنموذج إيجابي.','محتوى عن ثقافتنا لتعزيز employer brand.',
   '[{"author":"@hr_watcher","text":"ثقافة ثمانية مختلفة","sentiment":"positive"}]'::jsonb,'[]'::jsonb, null)
) as x(search_terms, max_items, sort_order, total_tweets, positive_count, negative_count, neutral_count, insights, recommendations, sample_tweets, all_tweets, main_issues)
where not exists (
  select 1 from social_listening.tweet_analyses t
  where t.search_terms = x.search_terms
);

insert into social_listening.commentary_analyses
  (filename, transcription, segments, overall_score, strengths, improvements,
   excitement_timeline, emotional_analysis,
   clarity, enthusiasm, accuracy, timing, terminology, event_reaction, style_variety)
select * from (values
  ('hilal-vs-nasr-j22.mp3','مرحباً بكم من ملعب الأول بارك','[]'::jsonb,79,
   '["وصف قوي","حضور صوتي"]'::jsonb,'["الحياد","عمق تكتيكي"]'::jsonb,
   '[60,70,85,92,80,95,70,85,90,88,95,82,90,85,70,88,92,80]'::jsonb,
   '{"dominant":"excited"}'::jsonb,
   '{"score":85}'::jsonb,'{"score":88}'::jsonb,'{"score":77}'::jsonb,
   '{"score":83}'::jsonb,'{"score":78}'::jsonb,'{"score":88}'::jsonb,'{"score":74}'::jsonb),
  ('ittihad-vs-ahli-j20.mp3','أهلاً من جدة','[]'::jsonb,82,
   '["صوت متميز","لغة سليمة"]'::jsonb,'["إبداع","مقارنات تاريخية"]'::jsonb,
   '[65,75,80,88,75,92,70,80,85,80,90,78,85,80,70,85,88,75]'::jsonb,
   '{"dominant":"professional"}'::jsonb,
   '{"score":88}'::jsonb,'{"score":82}'::jsonb,'{"score":82}'::jsonb,
   '{"score":85}'::jsonb,'{"score":86}'::jsonb,'{"score":85}'::jsonb,'{"score":76}'::jsonb),
  ('shabab-vs-raed-j18.mp3','من الرياض','[]'::jsonb,74,
   '["تغطية","إيقاع هادئ"]'::jsonb,'["عمق تكتيكي","تاريخي"]'::jsonb,
   '[55,60,65,70,70,75,72,78,82,80,82,78,80,75,68,78,80,72]'::jsonb,
   '{"dominant":"calm"}'::jsonb,
   '{"score":80}'::jsonb,'{"score":70}'::jsonb,'{"score":80}'::jsonb,
   '{"score":75}'::jsonb,'{"score":72}'::jsonb,'{"score":70}'::jsonb,'{"score":72}'::jsonb)
) as x(filename, transcription, segments, overall_score, strengths, improvements, excitement_timeline, emotional_analysis, clarity, enthusiasm, accuracy, timing, terminology, event_reaction, style_variety)
where not exists (
  select 1 from social_listening.commentary_analyses c where c.filename = x.filename
);

insert into social_listening.companies (name, group_name) values
  ('ثمانية','إعلام عربي'),('أرامكو','طاقة'),('STC','اتصالات'),('علم','حكومي رقمي')
on conflict do nothing;

insert into social_listening.candidate_searches
  (id, job_title, city, companies, search_query, total_results, skills, experience_level, job_titles, cities)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','مهندس برمجيات أول','الرياض',
   array['STC','علم','Careem'],'"Senior Software Engineer" Riyadh',42,
   array['Node.js','TypeScript','PostgreSQL','Kubernetes'],
   array['Senior','Lead'],array['Senior Software Engineer'],array['الرياض']),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','مدير منتج','الرياض',
   array['أرامكو','STC'],'"Product Manager" Riyadh',23,
   array['Product Strategy','Analytics','Arabic Market'],
   array['Senior'],array['Senior Product Manager'],array['الرياض'])
on conflict (id) do nothing;

insert into social_listening.candidates
  (search_id, name, linkedin_url, profile_summary, status,
   gender, citizenship, overall_relevancy_score, job_title_relevancy_score,
   industry_relevancy_score, years_relevant_experience, total_years_experience,
   qualification_status, ai_analysis)
select * from (values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,'عمر الحمدان','https://linkedin.com/in/omar-h',
   '8 سنوات Node/TS','qualified','male','سعودي',92,95,90,7.5,8.0,'qualified','{"fit":"excellent"}'::jsonb),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,'سارة الصالح','https://linkedin.com/in/sara-s',
   'Staff Engineer في علم','qualified','female','سعودية',88,85,92,9.0,10.0,'overqualified','{"fit":"overfit"}'::jsonb),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,'فيصل التركي','https://linkedin.com/in/faisal-t',
   '4 سنوات خبرة','not_qualified','male','سعودي',62,60,65,3.5,4.0,'underqualified','{"fit":"underfit"}'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,'هدى المطيري','https://linkedin.com/in/huda-m',
   'Senior PM أرامكو','qualified','female','سعودية',94,95,92,6.0,7.0,'qualified','{"fit":"excellent"}'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,'طارق الجبر','https://linkedin.com/in/tariq-j',
   'PM سابق Uber KSA','qualified','male','سعودي',85,88,80,5.0,5.5,'qualified','{"fit":"good"}'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,'لين الخليف','https://linkedin.com/in/leen-k',
   'Group PM STC','pending','female','سعودية',81,75,90,8.0,9.0,'overqualified','{"fit":"stretch"}'::jsonb)
) as x(search_id,name,linkedin_url,profile_summary,status,gender,citizenship,overall_relevancy_score,job_title_relevancy_score,industry_relevancy_score,years_relevant_experience,total_years_experience,qualification_status,ai_analysis)
where not exists (
  select 1 from social_listening.candidates c where c.linkedin_url = x.linkedin_url
);
