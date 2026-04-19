-- =====================================================================
-- Seed comprehensive demo data across every tool schema
--
-- Every insert is idempotent (ON CONFLICT DO NOTHING on primary keys,
-- or keyed by synthetic IDs) so re-running on a live DB is safe.
--
-- Populates:
--   · podcast_video.podcasts (3) + scenes (16)
--   · commentator.reports (6)
--   · hr_approval.vacancy_requests (3) + approval_steps (10) + ai_analyses (1)
--   · feedback.employees (15) + evaluations (7) + performance_reviews (8)
--     + leader_evaluations (4) + retention_flags (2) + leader_analyses (3)
--   · chatbot.documents (3) + chunks (10) + conversations (2) + messages (6) + query_logs (5)
--   · social_listening.tweet_analyses (6) + commentary_analyses (3)
--     + candidate_searches (2) + candidates (6) + companies (4)
-- =====================================================================

-- ───────────────────────── podcast_video ────────────────────────────
insert into podcast_video.podcasts
  (id, title, description, duration, upload_date, status, scenes_count, source,
   raw_transcript, main_themes, key_takeaways, enriched_description, pipeline_status)
values
  ('demo-pod-1',
   'سوالف بزنس — ريادة الأعمال في السعودية',
   'حلقة شاملة تستعرض رحلة ريادة الأعمال في المملكة من البدايات المتواضعة إلى رؤية 2030.',
   '45:30', '2026-03-28', 'ready', 6, 'upload',
   'نص تفصيلي لبودكاست ريادة الأعمال — يُعاد ملؤه من الأداة عند كل تحليل.',
   array['ريادة الأعمال','رؤية 2030','الاستثمار','ذكاء اصطناعي','السعودية'],
   array['السوق السعودي مليء بالفرص','رؤية 2030 فتحت الباب','ابدأ صغيراً','AI هو المستقبل','التوسع الإقليمي يبدأ محلياً'],
   'حوار ملهم عن بدايات ريادة الأعمال في السعودية.',
   '{"stage":"complete","progress":100}'::jsonb),
  ('demo-pod-2',
   'فنجان — مستقبل التقنية والذكاء الاصطناعي',
   'حوار معمّق يستكشف تأثير الذكاء الاصطناعي والتحول الرقمي على سوق العمل السعودي.',
   '62:15', '2026-03-25', 'ready', 5, 'transcript',
   'نص تفصيلي لبودكاست AI.',
   array['ذكاء اصطناعي','تحول رقمي','سوق العمل','أخلاقيات تقنية','روبوتات'],
   array['40% من الوظائف ستتغير','التعليم يحتاج إعادة هيكلة','القطاع الصحي المستفيد الأكبر','الخصوصية تحتاج تنظيم','الروبوتات تكمل الإنسان'],
   'حوار عميق مع خبير في الذكاء الاصطناعي.',
   '{"stage":"complete","progress":100}'::jsonb),
  ('demo-pod-3',
   'سوالف بزنس — التسويق الرقمي الفعّال',
   'دليل شامل لاستراتيجيات التسويق الرقمي الحديثة.',
   '38:45', '2026-03-20', 'ready', 5, 'video-url',
   'نص تفصيلي لبودكاست التسويق.',
   array['تسويق رقمي','وسائل التواصل','المحتوى','المؤثرين','تحليل بيانات'],
   array['المحتوى القيّم أساس الثقة','تيك توك وسناب يحكمان الخليج','الميكرو مؤثرون أفضل ROI','قياس العائد شرط','SEO العربي فرصة'],
   'ورشة عملية عن التسويق الرقمي السعودي.',
   '{"stage":"complete","progress":100}'::jsonb)
on conflict (id) do nothing;

insert into podcast_video.scenes
  (id, podcast_id, title, start_time, end_time, content, summary, topics, mood, "order")
values
  ('demo-pod-1-s1','demo-pod-1','المقدمة والترحيب','00:00','03:45','مرحباً بكم في حلقة جديدة.','ترحيب.',array['مقدمة'],'ودّي',1),
  ('demo-pod-1-s2','demo-pod-1','قصة البداية','03:45','12:30','بدأت كطالب جامعي.','بداية.',array['بدايات','ريادة أعمال'],'ملهم',2),
  ('demo-pod-1-s3','demo-pod-1','التحديات والعقبات','12:30','22:00','أكبر تحدي كان إقناع المستثمرين.','تحديات.',array['تحديات','استثمار'],'جدّي',3),
  ('demo-pod-1-s4','demo-pod-1','دور رؤية 2030','22:00','30:15','رؤية 2030 غيّرت المشهد.','رؤية 2030.',array['رؤية 2030','دعم حكومي'],'متفائل',4),
  ('demo-pod-1-s5','demo-pod-1','نصائح لرواد الأعمال الشباب','30:15','38:00','ابدأ صغيراً.','نصائح.',array['نصائح','شباب'],'تحفيزي',5),
  ('demo-pod-1-s6','demo-pod-1','المستقبل والخطط القادمة','38:00','45:30','نخطط للتوسع في الخليج.','مستقبل.',array['توسع','AI'],'طموح',6),
  ('demo-pod-2-s1','demo-pod-2','افتتاح النقاش','00:00','08:20','الذكاء الاصطناعي هنا الآن.','افتتاحية.',array['AI'],'تأمّلي',1),
  ('demo-pod-2-s2','demo-pod-2','أثر AI على الوظائف','08:20','22:10','40% من الوظائف ستتغير.','وظائف.',array['سوق العمل'],'جدّي',2),
  ('demo-pod-2-s3','demo-pod-2','التعليم والتحول الرقمي','22:10','36:40','التعليم يحتاج إعادة هيكلة.','تعليم.',array['تعليم'],'حاسم',3),
  ('demo-pod-2-s4','demo-pod-2','الأخلاقيات والخصوصية','36:40','50:30','تحتاج تنظيماً.','أخلاقيات.',array['أخلاقيات'],'تحذيري',4),
  ('demo-pod-2-s5','demo-pod-2','الروبوتات ومستقبل العمل','50:30','62:15','الروبوتات تكمل الإنسان.','روبوتات.',array['روبوتات'],'متفائل',5),
  ('demo-pod-3-s1','demo-pod-3','التحول في المشهد التسويقي','00:00','07:50','تغيّرت قواعد اللعبة.','تحول.',array['تحول'],'حاسم',1),
  ('demo-pod-3-s2','demo-pod-3','المحتوى هو الملك','07:50','16:20','المحتوى أساس الثقة.','محتوى.',array['محتوى'],'حماسي',2),
  ('demo-pod-3-s3','demo-pod-3','الميكرو مؤثرون','16:20','24:00','ميكرو مؤثر = ROI أعلى.','مؤثرون.',array['مؤثرون'],'ودّي',3),
  ('demo-pod-3-s4','demo-pod-3','قياس العائد على الاستثمار','24:00','32:00','كل ريال يجب قياسه.','قياس.',array['تحليل'],'عملي',4),
  ('demo-pod-3-s5','demo-pod-3','فرص SEO العربي','32:00','38:45','SEO العربي فرصة.','SEO.',array['SEO'],'تحليلي',5)
on conflict (id) do nothing;

-- ───────────────────────── commentator.reports ──────────────────────
insert into commentator.reports
  (commentator_name, role, channel, team_a, team_b, match_score, competition, match_date,
   overall_score, rating, video_url, comments, tags, report)
select x.name, x.role, x.channel, x.team_a, x.team_b, x.score, x.comp, x.md,
       x.o_score, x.rating, x.url, x.cmts, x.tags, x.rep::jsonb
from (values
  ('فهد العتيبي','معلق','SSC HD','الهلال','النصر','3 - 2','دوري روشن — الجولة 22','2026-02-08'::date,79,'جيد جدًا',
   'https://mimir.thmanyah.com/videos/hilal-nasr-j22','أداء قوي في وصف الأهداف.',
   array['وصف أهداف','حاسم'],
   '{"match_info":{"team_a":"الهلال","team_b":"النصر","score":"3 - 2","competition":"دوري روشن — الجولة 22","date":"2026-02-08"},"commentator":{"name":"فهد العتيبي","channel":"SSC HD"},"overall":{"score":79,"rating":"جيد جدًا","summary":"أداء قوي"},"categories":[]}'),
  ('عيسى الحربين','معلق','SSC Sport 1','الاتحاد','الأهلي','1 - 1','دوري روشن — الجولة 20','2026-01-25'::date,82,'جيد جدًا',
   'https://mimir.thmanyah.com/videos/ittihad-ahli-j20','صوت متميز وثراء لغوي.',
   array['صوت متميز'],
   '{"match_info":{"team_a":"الاتحاد","team_b":"الأهلي","score":"1 - 1","competition":"دوري روشن — الجولة 20","date":"2026-01-25"},"commentator":{"name":"عيسى الحربين","channel":"SSC Sport 1"},"overall":{"score":82,"rating":"جيد جدًا","summary":"صوت متميز"},"categories":[]}'),
  ('فهد العتيبي','معلق','SSC HD','الشباب','الرائد','2 - 0','دوري روشن — الجولة 18','2026-01-11'::date,74,'جيد',
   'https://mimir.thmanyah.com/videos/shabab-raed-j18','تغطية جيدة، يحتاج عمقاً تكتيكياً.',
   array['تغطية'],
   '{"match_info":{"team_a":"الشباب","team_b":"الرائد","score":"2 - 0","competition":"دوري روشن — الجولة 18","date":"2026-01-11"},"commentator":{"name":"فهد العتيبي","channel":"SSC HD"},"overall":{"score":74,"rating":"جيد","summary":"تغطية جيدة"},"categories":[]}'),
  ('سارة المالكي','مقدم','SSC HD','استوديو','دوري روشن','—','استوديو التحليل — الجولة 22','2026-02-08'::date,85,'جيد جدًا',
   'https://mimir.thmanyah.com/videos/studio-j22','حضور قوي وإدارة حوار متميزة.',
   array['حضور قوي'],
   '{"match_info":{"team_a":"استوديو","team_b":"دوري روشن","score":"—","competition":"استوديو التحليل — الجولة 22","date":"2026-02-08"},"commentator":{"name":"سارة المالكي","channel":"SSC HD"},"overall":{"score":85,"rating":"جيد جدًا","summary":"حضور كاميرا متمكن"},"categories":[]}'),
  ('أحمد الشهري','مراسل','SSC HD','الهلال','النصر','3 - 2','دوري روشن — الجولة 22','2026-02-08'::date,77,'جيد',
   'https://mimir.thmanyah.com/videos/reporter-hilal-nasr-j22','تقرير ميداني دقيق.',
   array['ميداني','دقة'],
   '{"match_info":{"team_a":"الهلال","team_b":"النصر","score":"3 - 2","competition":"دوري روشن — الجولة 22","date":"2026-02-08"},"commentator":{"name":"أحمد الشهري","channel":"SSC HD"},"overall":{"score":77,"rating":"جيد","summary":"تقرير ميداني"},"categories":[]}'),
  ('خالد الزهراني','محلل','SSC Sport 1','الاتحاد','الأهلي','1 - 1','دوري روشن — الجولة 20','2026-01-25'::date,81,'جيد جدًا',
   'https://mimir.thmanyah.com/videos/analyst-ittihad-ahli-j20','تحليل تكتيكي عميق.',
   array['تحليل تكتيكي'],
   '{"match_info":{"team_a":"الاتحاد","team_b":"الأهلي","score":"1 - 1","competition":"دوري روشن — الجولة 20","date":"2026-01-25"},"commentator":{"name":"خالد الزهراني","channel":"SSC Sport 1"},"overall":{"score":81,"rating":"جيد جدًا","summary":"تحليل تكتيكي عميق"},"categories":[]}')
) as x(name, role, channel, team_a, team_b, score, comp, md, o_score, rating, url, cmts, tags, rep)
where not exists (
  select 1 from commentator.reports r
  where r.commentator_name = x.name and r.match_date = x.md and r.competition = x.comp
);

-- ───────────────────────── seed-cutoff marker ──────────────────────
-- The HR, feedback, chatbot, and social_listening seed inserts are
-- large enough to live in dedicated migrations for clarity. See:
--   · 20260419140001_seed_hr_approval_demo.sql
--   · 20260419140002_seed_feedback_demo.sql
--   · 20260419140003_seed_chatbot_demo.sql
--   · 20260419140004_seed_social_listening_demo.sql
