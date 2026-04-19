-- Seed feedback schema: 15 employees + evaluations + performance reviews
-- + leader evaluations + retention flags + leader analyses.

insert into feedback.employees
  (id, name, preferred_name, department, team, level, job_title_ar, job_title_en,
   manager, office, start_date, current_location, work_type, in_probation,
   last_promotion_date, service_months, service_years, current_contract,
   is_leader, overall_rating, gender, nationality, age, work_email)
values
  ('E-1001','نورة السديري','نورة','المنتج','إدارة',7,'رئيسة المنتج','Head of Product',null,'الرياض','2023-05-01','الرياض','مكتبي',false,'2025-02-01',36,3.0,'سنوي',true,'A','female','سعودية',34,'noura@thmanyah.com'),
  ('E-1002','خالد العبيدي','خالد','المنتج','الواجهة الأمامية',6,'قائد هندسة','Eng Lead','نورة السديري','الرياض','2023-09-15','الرياض','هايبرد',false,'2025-06-01',30,2.5,'سنوي',true,'A','male','سعودي',31,'khaled@thmanyah.com'),
  ('E-1003','مهند الغامدي','مهند','المنتج','الواجهة الأمامية',5,'مهندس أول','Senior Engineer','خالد العبيدي','الرياض','2024-01-10','الرياض','مكتبي',false,null,27,2.25,'سنوي',false,'B+','male','سعودي',28,'muhannad@thmanyah.com'),
  ('E-1004','ريم الدوسري','ريم','المحتوى','المنصّة الصوتية',5,'مديرة محتوى','Content Manager','يزيد القحطاني','الرياض','2023-11-01','الرياض','مكتبي',false,null,29,2.4,'سنوي',true,'A-','female','سعودية',30,'reem@thmanyah.com'),
  ('E-1005','يزيد القحطاني','يزيد','المحتوى','القيادة',7,'رئيس المحتوى','Head of Content',null,'الرياض','2022-08-01','الرياض','هايبرد',false,'2024-09-01',44,3.67,'سنوي',true,'A','male','سعودي',36,'yazid@thmanyah.com'),
  ('E-1006','سلمى الحربي','سلمى','المحتوى','التحرير',4,'محرّرة','Editor','ريم الدوسري','الرياض','2025-07-15','الرياض','مكتبي',true,null,9,0.75,'تجربة',false,'B','female','سعودية',26,'salma@thmanyah.com'),
  ('E-1007','عبدالله الشهري','عبدالله','التسويق','الإعلانات',5,'مدير تسويق','Marketing Manager','سلطان الحربي','الرياض','2023-03-01','الرياض','مكتبي',false,null,37,3.08,'سنوي',true,'B+','male','سعودي',33,'abdullah@thmanyah.com'),
  ('E-1008','سلطان الحربي','سلطان','التسويق','القيادة',7,'رئيس التسويق','Head of Marketing',null,'الرياض','2022-06-01','الرياض','هايبرد',false,'2024-07-01',46,3.83,'سنوي',true,'A-','male','سعودي',38,'sultan@thmanyah.com'),
  ('E-1009','منال القرني','منال','المالية','المحاسبة',6,'قائدة مالية','Finance Lead',null,'الرياض','2023-01-15','الرياض','مكتبي',false,'2025-01-15',39,3.25,'سنوي',true,'A','female','سعودية',35,'manal@thmanyah.com'),
  ('E-1010','لارا العنزي','لارا','الموارد البشرية','عمليات الموارد',5,'قائدة موارد بشرية','HR Lead',null,'الرياض','2023-08-01','الرياض','مكتبي',false,null,32,2.67,'سنوي',true,'A','female','سعودية',32,'lara@thmanyah.com'),
  ('E-1011','فيصل المطيري','فيصل','المحتوى','القيادة',6,'قائد بودكاست','Podcast Lead','يزيد القحطاني','الرياض','2022-10-01','الرياض','مكتبي',false,null,42,3.5,'سنوي',true,'A','male','سعودي',37,'faisal@thmanyah.com'),
  ('E-1012','سارة الخالدي','سارة','المحتوى','المنصّة الصوتية',4,'منتجة بودكاست','Podcast Producer','فيصل المطيري','الرياض','2024-04-01','الرياض','مكتبي',false,null,24,2.0,'سنوي',false,'B','female','سعودية',27,'sara@thmanyah.com'),
  ('E-1013','محمد الشمري','محمد','المنتج','التصميم',5,'مصمم منتج أول','Senior Product Designer','نورة السديري','الرياض','2023-06-01','الرياض','هايبرد',false,null,34,2.83,'سنوي',false,'A-','male','سعودي',29,'mohammed@thmanyah.com'),
  ('E-1014','هيا السبيعي','هيا','المنتج','البحث',4,'باحثة UX','UX Researcher','نورة السديري','الرياض','2024-11-15','الرياض','مكتبي',true,null,5,0.42,'تجربة',false,'B','female','سعودية',25,'haya@thmanyah.com'),
  ('E-1015','بدر العمري','بدر','العمليات','البنية التحتية',6,'قائد عمليات','Ops Lead',null,'الرياض','2022-12-01','الرياض','مكتبي',false,'2024-12-01',40,3.33,'سنوي',true,'A','male','سعودي',34,'badr@thmanyah.com')
on conflict (id) do nothing;

insert into feedback.evaluations
  (id, submitted_at, evaluation_type, evaluator_name, employee_name, employee_id,
   first_impression_scores, midpoint_scores, decision_station_scores,
   start_feedback, stop_feedback, continue_feedback, traffic_light,
   traffic_light_score, decision_direction, final_decision, additional_notes)
values
  ('EV-1','2025-09-01 10:00:00+03','first_impression','خالد العبيدي','مهند الغامدي','E-1003',
   '{"communication":8,"quality":9,"ownership":8,"culture":9}'::jsonb,null,null,
   'code-review أعمق','توقف عن over-engineering','استمر في الأمثلة','green',85,'retain',null,'بداية قوية'),
  ('EV-2','2025-11-01 10:00:00+03','midpoint','خالد العبيدي','مهند الغامدي','E-1003',
   null,'{"communication":9,"quality":9,"ownership":9,"culture":9}'::jsonb,null,
   null,null,null,'green',90,'retain',null,'أفضل تعيينات الربع'),
  ('EV-3','2026-01-10 10:00:00+03','decision_station','خالد العبيدي','مهند الغامدي','E-1003',
   null,null,'{"communication":9,"quality":10,"ownership":9,"culture":10}'::jsonb,
   null,null,null,'green',95,'retain','confirm','تثبيت وترشيح L6'),
  ('EV-4','2025-08-01 10:00:00+03','first_impression','ريم الدوسري','سلمى الحربي','E-1006',
   '{"communication":7,"quality":7,"ownership":6,"culture":8}'::jsonb,null,null,
   'الالتزام بالمواعيد','خارج نطاق المشروع','التفاعل الإيجابي','amber',68,'watch',null,'ترتيب أولويات'),
  ('EV-5','2025-10-15 10:00:00+03','midpoint','ريم الدوسري','سلمى الحربي','E-1006',
   null,'{"communication":7,"quality":8,"ownership":7,"culture":8}'::jsonb,null,
   null,null,null,'amber',74,'watch',null,'تحسّن في الجودة'),
  ('EV-6','2026-01-01 10:00:00+03','decision_station','ريم الدوسري','سلمى الحربي','E-1006',
   null,null,'{"communication":8,"quality":8,"ownership":8,"culture":9}'::jsonb,
   null,null,null,'green',82,'retain','confirm','تثبيت — تطوّر ملحوظ'),
  ('EV-7','2026-01-20 10:00:00+03','first_impression','نورة السديري','هيا السبيعي','E-1014',
   '{"communication":8,"quality":9,"ownership":9,"culture":9}'::jsonb,null,null,
   'أسئلة بحث أعمق','تحليل نفسك قبل المستخدم','التوثيق الممتاز','green',88,'retain',null,'بداية قوية للبحث')
on conflict (id) do nothing;

insert into feedback.performance_reviews
  (id, employee_name, employee_id, direct_leader, manager_of_manager, review_number,
   station, general_track, general_track_score, general_track_percent,
   leadership_track, leadership_track_score, leadership_percent,
   met_expectations, review_status, season, review_date,
   manager_comments, hr_comments, leadership_potential, retain_employee,
   is_leader, department, job_title)
values
  ('PR-2025-Q4-1003','مهند الغامدي','E-1003','خالد العبيدي','نورة السديري','Q4-2025','decision','A-',92,88,null,null,null,'exceeds','approved','Q4-2025','2025-12-20','أداء متميز.','موصى لـ L6.','high','yes',false,'المنتج','مهندس أول'),
  ('PR-2025-Q4-1002','خالد العبيدي','E-1002','نورة السديري',null,'Q4-2025','midpoint','A',95,93,'A',90,87,'exceeds','approved','Q4-2025','2025-12-20','قيادة واضحة.','مرشّح L7.','high','yes',true,'المنتج','قائد هندسة'),
  ('PR-2025-Q4-1004','ريم الدوسري','E-1004','يزيد القحطاني',null,'Q4-2025','decision','A',93,90,'A-',85,82,'exceeds','approved','Q4-2025','2025-12-21','قيادة متزنة.','يوصى بتوسيع النطاق.','high','yes',true,'المحتوى','مديرة محتوى'),
  ('PR-2025-Q4-1007','عبدالله الشهري','E-1007','سلطان الحربي',null,'Q4-2025','first_impression','B+',82,80,'B',75,72,'meets','approved','Q4-2025','2025-12-18','أداء متماسك.','تدريب إداري متقدم.','medium','yes',true,'التسويق','مدير تسويق'),
  ('PR-2025-Q3-1003','مهند الغامدي','E-1003','خالد العبيدي','نورة السديري','Q3-2025','midpoint','B+',86,82,null,null,null,'meets','approved','Q3-2025','2025-09-30','يتحسّن في المعماريات.',null,'medium','yes',false,'المنتج','مهندس أول'),
  ('PR-2025-Q3-1006','سلمى الحربي','E-1006','ريم الدوسري',null,'Q3-2025','first_impression','B-',72,68,null,null,null,'below','approved','Q3-2025','2025-09-28','إدارة الأولويات.','متابعة Q4','medium','yes',false,'المحتوى','محرّرة'),
  ('PR-2025-Q4-1013','محمد الشمري','E-1013','نورة السديري',null,'Q4-2025','midpoint','A-',88,85,null,null,null,'exceeds','approved','Q4-2025','2025-12-22','تصاميم احترافية.',null,'high','yes',false,'المنتج','مصمم منتج أول'),
  ('PR-2025-Q4-1012','سارة الخالدي','E-1012','فيصل المطيري',null,'Q4-2025','decision','B+',84,80,null,null,null,'meets','approved','Q4-2025','2025-12-19','إنتاج موثوق.',null,'medium','yes',false,'المحتوى','منتجة بودكاست')
on conflict (id) do nothing;

insert into feedback.leader_evaluations
  (id, submitted_at, evaluator_name, leader_name, leader_id,
   communication, prioritization, decision_making, goal_setting, clarity_comments,
   empowerment, delegation, support, emotional_intelligence, work_method_comments,
   morale, collaboration, environment, inclusion, team_leadership_comments,
   development, feedback, performance, creativity, development_comments,
   general_comments, hr_comments, average_score)
values
  ('LE-1','2026-01-15 10:00:00+03','مهند الغامدي','خالد العبيدي','E-1002',9,9,8,9,'قائد واضح',9,8,9,9,'مساحة تنفيذ',9,9,9,9,'ثقة عالية',9,9,9,8,'دعم مباشر','قائد نموذجي','يستحق التقدير',8.9),
  ('LE-2','2026-01-15 10:00:00+03','محمد الشمري','نورة السديري','E-1001',10,9,9,9,'رؤية واضحة',9,9,9,10,'دون ضغط',10,9,9,10,'تعزيز الشمول',9,9,10,9,'فرص تعلم مستمرة','قائدة استثنائية','مرشحة للترقية',9.3),
  ('LE-3','2026-01-20 10:00:00+03','سارة الخالدي','فيصل المطيري','E-1011',9,8,8,8,'تواصل ممتاز',8,8,9,8,'تفويض يحتاج تحسين',9,9,8,9,null,8,8,9,8,null,null,null,8.4),
  ('LE-4','2026-01-25 10:00:00+03','عبدالله الشهري','سلطان الحربي','E-1008',8,7,7,7,'تركيز على الأولويات',7,7,7,8,'تفاصيل على الاستراتيجية',8,8,8,8,null,7,7,8,7,null,'مقبول مع مجال للتطوير',null,7.4)
on conflict (id) do nothing;

insert into feedback.retention_flags
  (id, employee_name, employee_id, direct_leader, general_track, general_track_percent,
   leadership_track, retain_employee, department, manager_justification)
values
  ('RF-1','سلمى الحربي','E-1006','ريم الدوسري','B',74,null,'watch','المحتوى','تحسّن ملحوظ، متابعة'),
  ('RF-2','عبدالله الشهري','E-1007','سلطان الحربي','B+',80,'B','watch','التسويق','القيادة تحتاج تطوير')
on conflict (id) do nothing;

insert into feedback.leader_analyses
  (leader_name, leader_id, strengths, weaknesses, recommendations, ideal_team, action_steps, comparison)
select * from (values
  ('نورة السديري','E-1001','رؤية منتج واضحة','قرارات منفردة أحياناً','تفويض أعمق','فريق منتج متخصّص','جلسة تفويض شهرية','أعلى 10%'),
  ('خالد العبيدي','E-1002','قائد هندسي فني','يحتاج إدارة أفراد','20% وقته لـ1:1','فريق 6 مهندسين','برنامج قيادة Q2','متميز'),
  ('ريم الدوسري','E-1004','قيادة ناعمة','تحفظ في القرارات','استقلالية قرار','فريق 8 أعضاء','مبادرة شهرية','أفضل من المتوسط')
) as x(leader_name,leader_id,strengths,weaknesses,recommendations,ideal_team,action_steps,comparison)
where not exists (
  select 1 from feedback.leader_analyses la where la.leader_id = x.leader_id
);
