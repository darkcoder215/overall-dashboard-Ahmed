-- Seed hr_approval demo data. Idempotent via NOT EXISTS guards on
-- requester_email + job_title.

with req1 as (
  insert into hr_approval.vacancy_requests
    (status, current_approval_step, requester_name, requester_email,
     department, team, budget_owner, vacancy_type, positions_count,
     job_title, job_title_en, job_level, role_nature, job_description,
     country, work_location, nationality,
     tried_alternatives, alternatives_description,
     risks_if_not_hired, hiring_bar_commitment,
     is_in_approved_structure, structure_justification)
  select 'pending_approval', 2, 'مهند الغامدي', 'muhannad@thmanyah.com',
     'المنتج', 'الواجهة الأمامية', 'خالد العبيدي', 'new_position', 1,
     'مهندس واجهة أمامية أول', 'Senior Front-end Engineer', 'L5', 'full_time',
     'تطوير واجهات React/Next.js لمشاريع ثمانية الرقمية.',
     'السعودية', 'الرياض — هايبرد', 'saudi',
     true, 'ترقية داخلية فشلت لحجم الفجوة',
     'تأخر مشروع مسار لـ3 أشهر', 'نلتزم بالهيرينغ بار',
     true, 'ضمن الهيكل المعتمد'
  where not exists (
    select 1 from hr_approval.vacancy_requests
    where requester_email = 'muhannad@thmanyah.com' and job_title = 'مهندس واجهة أمامية أول'
  )
  returning id
)
insert into hr_approval.approval_steps
  (request_id, step_order, role, approver_name, approver_email, status, comment, decided_at)
select id, ord, role, approver_name, approver_email, status, comment, decided_at
from req1, lateral (values
  (0,'Budget Owner','خالد العبيدي','khaled@thmanyah.com','approved','موافق', now() - interval '3 days'),
  (1,'Department Head','نورة السديري','noura@thmanyah.com','approved','ضروري', now() - interval '2 days'),
  (2,'Culture/CPO','عمار الفيصل','ammar@thmanyah.com','pending',null,null)
) as s(ord,role,approver_name,approver_email,status,comment,decided_at);

with req2 as (
  insert into hr_approval.vacancy_requests
    (status, current_approval_step, requester_name, requester_email,
     department, team, budget_owner, vacancy_type, positions_count,
     previous_employee_name, departure_date, departure_type, departure_reason,
     job_title, job_title_en, job_level, role_nature, job_description,
     country, work_location, nationality,
     is_in_approved_structure, structure_justification)
  select 'approved', 3, 'ريم الدوسري', 'reem@thmanyah.com',
     'المحتوى', 'المنصّة الصوتية', 'فيصل المطيري', 'replacement', 1,
     'سارة الخالدي', '2026-03-15', 'resignation', 'فرصة عمل أخرى',
     'منتج بودكاست', 'Podcast Producer', 'L3', 'full_time',
     'إنتاج وتحرير حلقات البودكاست الرئيسية.',
     'السعودية', 'الرياض — مكتبي', 'arab',
     true, 'وظيفة ضمن الهيكل المعتمد'
  where not exists (
    select 1 from hr_approval.vacancy_requests
    where requester_email = 'reem@thmanyah.com' and job_title = 'منتج بودكاست'
  )
  returning id
)
insert into hr_approval.approval_steps
  (request_id, step_order, role, approver_name, approver_email, status, comment, decided_at)
select id, ord, role, approver_name, approver_email, status, comment, decided_at
from req2, lateral (values
  (0,'Budget Owner','فيصل المطيري','faisal@thmanyah.com','approved','استبدال طبيعي', now() - interval '10 days'),
  (1,'Department Head','يزيد القحطاني','yazid@thmanyah.com','approved','عاجل', now() - interval '9 days'),
  (2,'HR','لارا العنزي','lara@thmanyah.com','approved','ميزانية الاستبدال موجودة', now() - interval '8 days'),
  (3,'Culture/CPO','عمار الفيصل','ammar@thmanyah.com','approved','موافق', now() - interval '7 days')
) as s(ord,role,approver_name,approver_email,status,comment,decided_at);

with req3 as (
  insert into hr_approval.vacancy_requests
    (status, current_approval_step, requester_name, requester_email,
     department, team, budget_owner, vacancy_type, positions_count,
     job_title, job_title_en, job_level, role_nature, job_description,
     country, work_location, nationality,
     risks_if_not_hired, is_in_approved_structure, structure_justification,
     rejection_reason)
  select 'rejected', 1, 'عبدالله الشهري', 'abdullah@thmanyah.com',
     'التسويق', 'الإعلانات', 'سلطان الحربي', 'new_position', 2,
     'أخصائي إعلانات رقمية', 'Digital Ads Specialist', 'L2', 'full_time',
     'إدارة حملات Google/Meta/Snap Ads.',
     'السعودية', 'الرياض — مكتبي', 'arab',
     'انخفاض أداء الحملات', true, 'ضمن الهيكل المعتمد',
     'غير مبرر مالياً، وكالة خارجية بتكلفة أقل'
  where not exists (
    select 1 from hr_approval.vacancy_requests
    where requester_email = 'abdullah@thmanyah.com' and job_title = 'أخصائي إعلانات رقمية'
  )
  returning id
)
insert into hr_approval.approval_steps
  (request_id, step_order, role, approver_name, approver_email, status, comment, decided_at)
select id, ord, role, approver_name, approver_email, status, comment, decided_at
from req3, lateral (values
  (0,'Budget Owner','سلطان الحربي','sultan@thmanyah.com','approved','ضمن الميزانية', now() - interval '5 days'),
  (1,'Finance Lead','منال القرني','manal@thmanyah.com','rejected','ROI غير مبرر', now() - interval '4 days'),
  (2,'Culture/CPO','عمار الفيصل','ammar@thmanyah.com','pending',null,null)
) as s(ord,role,approver_name,approver_email,status,comment,decided_at);

-- AI analysis linked to request 1 (if it exists).
insert into hr_approval.ai_analyses
  (request_id, overall_score, score_label, summary, dimensions, strengths, concerns,
   ai_risk_assessment, budget_consideration, recommendation, suggested_questions, model)
select r.id, 82, 'موصى به',
  'منصب جوهري لمسار المنتج مع مبرر واضح.',
  '[{"name":"business_impact","score":90},{"name":"urgency","score":85},{"name":"cost","score":75},{"name":"alternatives","score":70}]'::jsonb,
  array['مبرر استراتيجي قوي','ميزانية واضحة','تم تجربة البدائل'],
  array['سوق L5 شحيح','وقت التوظيف قد يتجاوز 3 أشهر'],
  'يمكن الاستغناء جزئياً عن بعض مهام التصميم التقني باستخدام AI.',
  'راتب سنوي متوقع 360-480 ألف ريال.',
  'موصى به بقوة.',
  array['كيف تختبر L5 في المقابلة؟','ما خطتك الاحتياطية؟','معايير نجاح الشهرين الأولين؟'],
  'anthropic/claude-opus-4-7'
from hr_approval.vacancy_requests r
where r.requester_email = 'muhannad@thmanyah.com'
  and r.job_title = 'مهندس واجهة أمامية أول'
  and not exists (select 1 from hr_approval.ai_analyses a where a.request_id = r.id);
