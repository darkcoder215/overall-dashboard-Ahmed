"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Building2,
  Briefcase,
  Globe,
  Users,
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  X,
} from "lucide-react";
import Header from "@/components/ui/Header";
import Button from "@/components/ui/Button";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginScreen from "@/components/ui/LoginScreen";
import {
  AppSettings,
  getSettings,
  saveSettings,
  resetSettings,
  getDefaultSettings,
  hasCustomSettings,
  ApprovalStepConfig,
} from "@/lib/settings";

function SettingsContent() {
  const { isAuthenticated, user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    approvalChain: true,
    departments: true,
    jobLevels: false,
    roleNatures: false,
    countries: false,
    messages: false,
  });

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = useCallback(() => {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [settings]);

  const handleReset = useCallback(() => {
    resetSettings();
    setSettings(getDefaultSettings());
    setResetConfirm(false);
    setSaved(false);
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isAuthenticated) return <LoginScreen />;

  if (user?.username !== "admin") {
    return (
      <div className="min-h-screen bg-thmanyah-off-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-thmanyah-red/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-thmanyah-red" />
          </div>
          <h1 className="font-display font-black text-[28px] mb-3">صفحة محظورة</h1>
          <p className="font-ui font-bold text-thmanyah-muted text-[15px]">
            هذه الصفحة متاحة فقط لمدير النظام (admin)
          </p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-thmanyah-off-white">
      <Header />

      {/* Page header */}
      <div className="bg-thmanyah-black text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="font-display font-black text-[28px] md:text-[36px]">إعدادات النظام</h1>
          </div>
          <p className="font-ui font-bold text-white/50 text-[14px] md:text-[15px]">
            تخصيص حقول النموذج، مسار الاعتماد، والقوائم المنسدلة
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Sticky save bar */}
        <div className="sticky top-14 md:top-16 z-30 bg-thmanyah-off-white pb-4">
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-thmanyah-warm-border">
            <div className="flex items-center gap-3">
              {saved ? (
                <div className="flex items-center gap-2 text-thmanyah-green animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-ui font-black text-[13px]">حفظنا التغييرات</span>
                </div>
              ) : (
                <span className="font-ui font-bold text-[13px] text-thmanyah-muted">
                  {hasCustomSettings() ? "إعدادات مخصصة نشطة" : "الإعدادات الافتراضية"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {resetConfirm ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="font-ui font-bold text-[12px] text-thmanyah-red">متأكد؟</span>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-thmanyah-red text-white rounded-full font-ui font-black text-[12px] cursor-pointer hover:bg-red-600 transition-colors"
                  >
                    نعم، استعادة
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="px-3 py-1.5 bg-thmanyah-cream text-thmanyah-muted rounded-full font-ui font-bold text-[12px] cursor-pointer hover:bg-thmanyah-warm-gray transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-thmanyah-muted hover:text-thmanyah-red rounded-full font-ui font-bold text-[12px] cursor-pointer transition-colors hover:bg-red-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  استعادة الافتراضي
                </button>
              )}
              <Button
                variant="accent"
                size="sm"
                icon={<Save className="w-3.5 h-3.5" />}
                onClick={handleSave}
              >
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Approval Chain */}
          <SettingsSection
            title="مسار الاعتماد"
            subtitle="تحكم في مراحل الاعتماد والمعتمدين والمهلة الزمنية"
            icon={<Shield className="w-5 h-5" />}
            expanded={expandedSections.approvalChain}
            onToggle={() => toggleSection("approvalChain")}
          >
            <ApprovalChainEditor
              chain={settings.approvalChain}
              onChange={(chain) => setSettings({ ...settings, approvalChain: chain })}
            />
          </SettingsSection>

          {/* Departments */}
          <SettingsSection
            title="الإدارات"
            subtitle={`${settings.departments.length} إدارة`}
            icon={<Building2 className="w-5 h-5" />}
            expanded={expandedSections.departments}
            onToggle={() => toggleSection("departments")}
          >
            <StringListEditor
              items={settings.departments}
              onChange={(items) => setSettings({ ...settings, departments: items })}
              placeholder="اسم الإدارة الجديدة"
            />
          </SettingsSection>

          {/* Job Levels */}
          <SettingsSection
            title="المستويات الوظيفية"
            subtitle={`${settings.jobLevels.length} مستوى`}
            icon={<Briefcase className="w-5 h-5" />}
            expanded={expandedSections.jobLevels}
            onToggle={() => toggleSection("jobLevels")}
          >
            <StringListEditor
              items={settings.jobLevels}
              onChange={(items) => setSettings({ ...settings, jobLevels: items })}
              placeholder="المستوى الوظيفي الجديد"
            />
          </SettingsSection>

          {/* Role Natures */}
          <SettingsSection
            title="طبيعة الدور"
            subtitle={`${settings.roleNatures.length} نوع`}
            icon={<Users className="w-5 h-5" />}
            expanded={expandedSections.roleNatures}
            onToggle={() => toggleSection("roleNatures")}
          >
            <KeyValueListEditor
              items={settings.roleNatures}
              onChange={(items) => setSettings({ ...settings, roleNatures: items })}
              keyPlaceholder="القيمة (مثال: full_time)"
              valuePlaceholder="التسمية (مثال: دوام كامل)"
            />
          </SettingsSection>

          {/* Countries */}
          <SettingsSection
            title="الدول"
            subtitle={`${settings.countries.length} دولة`}
            icon={<Globe className="w-5 h-5" />}
            expanded={expandedSections.countries}
            onToggle={() => toggleSection("countries")}
          >
            <StringListEditor
              items={settings.countries}
              onChange={(items) => setSettings({ ...settings, countries: items })}
              placeholder="اسم الدولة الجديدة"
            />
          </SettingsSection>

          {/* Messages */}
          <SettingsSection
            title="نصوص النموذج"
            subtitle="تحرير المقدمة والرسائل التوجيهية"
            icon={<FileText className="w-5 h-5" />}
            expanded={expandedSections.messages}
            onToggle={() => toggleSection("messages")}
          >
            <div className="space-y-5">
              <TextAreaField
                label="مقدمة التحدي"
                value={settings.introChallenge}
                onChange={(v) => setSettings({ ...settings, introChallenge: v })}
              />
              <TextAreaField
                label="مقدمة الفرصة"
                value={settings.introOpportunity}
                onChange={(v) => setSettings({ ...settings, introOpportunity: v })}
              />
              <TextAreaField
                label="رسالة معيار التوظيف"
                value={settings.hiringBarMessage}
                onChange={(v) => setSettings({ ...settings, hiringBarMessage: v })}
              />
              <TextAreaField
                label="ملاحظة مسار الاعتماد"
                value={settings.approvalFlowNote}
                onChange={(v) => setSettings({ ...settings, approvalFlowNote: v })}
              />
              <div>
                <label className="block font-ui font-black text-[13px] text-thmanyah-charcoal mb-2">
                  مدة SLA الإجمالية
                </label>
                <input
                  type="text"
                  value={settings.slaTotal}
                  onChange={(e) => setSettings({ ...settings, slaTotal: e.target.value })}
                  className="w-full px-4 py-3 bg-thmanyah-off-white border border-thmanyah-warm-border rounded-xl font-ui font-bold text-[14px] focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 focus:border-thmanyah-green transition-all"
                />
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthProvider>
      <SettingsContent />
    </AuthProvider>
  );
}

/* ── Section wrapper ── */
function SettingsSection({
  title,
  subtitle,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-thmanyah-warm-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 md:px-6 py-4 md:py-5 cursor-pointer hover:bg-thmanyah-off-white/50 transition-colors"
      >
        <div className="w-9 h-9 bg-thmanyah-off-white rounded-xl flex items-center justify-center text-thmanyah-charcoal shrink-0">
          {icon}
        </div>
        <div className="flex-1 text-right min-w-0">
          <p className="font-ui font-black text-[15px]">{title}</p>
          <p className="font-ui font-bold text-[12px] text-thmanyah-muted mt-0.5">{subtitle}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-thmanyah-muted shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-thmanyah-muted shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-5 md:px-6 pb-5 md:pb-6 pt-2 border-t border-thmanyah-warm-border animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Approval Chain Editor ── */
function ApprovalChainEditor({
  chain,
  onChange,
}: {
  chain: ApprovalStepConfig[];
  onChange: (chain: ApprovalStepConfig[]) => void;
}) {
  const addStep = () => {
    onChange([
      ...chain,
      {
        order: chain.length + 1,
        role: "",
        approverName: "",
        approverEmail: "",
        slaHours: 24,
      },
    ]);
  };

  const removeStep = (index: number) => {
    const updated = chain.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
    onChange(updated);
  };

  const updateStep = (index: number, field: keyof ApprovalStepConfig, value: string | number) => {
    const updated = [...chain];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === chain.length - 1) return;
    const updated = [...chain];
    const target = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <div className="space-y-3">
      {chain.map((step, i) => (
        <div
          key={i}
          className="bg-thmanyah-off-white rounded-xl p-4 border border-thmanyah-warm-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-thmanyah-black text-white flex items-center justify-center font-display font-black text-[13px] shrink-0">
              {i + 1}
            </div>
            <span className="font-ui font-black text-[13px] flex-1">المرحلة {i + 1}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveStep(i, "up")}
                disabled={i === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-thmanyah-muted disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveStep(i, "down")}
                disabled={i === chain.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-thmanyah-muted disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {chain.length > 1 && (
                <button
                  onClick={() => removeStep(i)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-thmanyah-muted hover:text-thmanyah-red cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-ui font-bold text-[11px] text-thmanyah-muted mb-1">الدور / المسمى</label>
              <input
                type="text"
                value={step.role}
                onChange={(e) => updateStep(i, "role", e.target.value)}
                placeholder="مثال: المدير المباشر"
                className="w-full px-3 py-2 bg-white border border-thmanyah-warm-border rounded-lg font-ui font-bold text-[13px] focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 focus:border-thmanyah-green transition-all"
              />
            </div>
            <div>
              <label className="block font-ui font-bold text-[11px] text-thmanyah-muted mb-1">اسم المعتمد</label>
              <input
                type="text"
                value={step.approverName}
                onChange={(e) => updateStep(i, "approverName", e.target.value)}
                placeholder="يُملأ من مقدم الطلب أو ثابت"
                className="w-full px-3 py-2 bg-white border border-thmanyah-warm-border rounded-lg font-ui font-bold text-[13px] focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 focus:border-thmanyah-green transition-all"
              />
            </div>
            <div>
              <label className="block font-ui font-bold text-[11px] text-thmanyah-muted mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={step.approverEmail}
                onChange={(e) => updateStep(i, "approverEmail", e.target.value)}
                placeholder="email@thmanyah.com"
                dir="ltr"
                className="w-full px-3 py-2 bg-white border border-thmanyah-warm-border rounded-lg font-ui font-bold text-[13px] text-left focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 focus:border-thmanyah-green transition-all"
              />
            </div>
            <div>
              <label className="block font-ui font-bold text-[11px] text-thmanyah-muted mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  المهلة الزمنية (ساعة)
                </span>
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={step.slaHours}
                onChange={(e) => updateStep(i, "slaHours", parseInt(e.target.value) || 24)}
                className="w-full px-3 py-2 bg-white border border-thmanyah-warm-border rounded-lg font-ui font-bold text-[13px] focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 focus:border-thmanyah-green transition-all"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-thmanyah-warm-border rounded-xl text-thmanyah-muted hover:border-thmanyah-green hover:text-thmanyah-green transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span className="font-ui font-black text-[13px]">إضافة مرحلة</span>
      </button>
    </div>
  );
}

/* ── String List Editor (departments, levels, countries) ── */
function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem("");
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null || !editValue.trim()) return;
    const updated = [...items];
    updated[editingIndex] = editValue.trim();
    onChange(updated);
    setEditingIndex(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-thmanyah-off-white rounded-xl px-4 py-2.5 border border-thmanyah-warm-border group"
          >
            {editingIndex === i ? (
              <>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  className="flex-1 bg-white px-3 py-1 rounded-lg border border-thmanyah-green font-ui font-bold text-[13px] focus:outline-none"
                />
                <button onClick={saveEdit} className="text-thmanyah-green cursor-pointer p-1">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button onClick={cancelEdit} className="text-thmanyah-muted cursor-pointer p-1">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-ui font-bold text-[13px]">{item}</span>
                <button
                  onClick={() => startEdit(i)}
                  className="opacity-0 group-hover:opacity-100 text-thmanyah-muted hover:text-thmanyah-blue cursor-pointer p-1 transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeItem(i)}
                  className="opacity-0 group-hover:opacity-100 text-thmanyah-muted hover:text-thmanyah-red cursor-pointer p-1 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 bg-thmanyah-off-white border border-thmanyah-warm-border rounded-xl font-ui font-bold text-[13px] focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 focus:border-thmanyah-green transition-all"
        />
        <button
          onClick={addItem}
          disabled={!newItem.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-thmanyah-green/10 text-thmanyah-green rounded-xl font-ui font-black text-[12px] hover:bg-thmanyah-green/20 disabled:opacity-40 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة
        </button>
      </div>
    </div>
  );
}

/* ── Key-Value List Editor (role natures) ── */
function KeyValueListEditor({
  items,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: {
  items: { value: string; label: string }[];
  onChange: (items: { value: string; label: string }[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const addItem = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    onChange([...items, { value: newKey.trim(), label: newValue.trim() }]);
    setNewKey("");
    setNewValue("");
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "value" | "label", val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-thmanyah-off-white rounded-xl px-4 py-2.5 border border-thmanyah-warm-border group"
          >
            <input
              type="text"
              value={item.value}
              onChange={(e) => updateItem(i, "value", e.target.value)}
              dir="ltr"
              className="w-[120px] md:w-[160px] px-2 py-1 bg-white border border-thmanyah-warm-border rounded-lg font-ui font-bold text-[12px] text-left focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 shrink-0"
            />
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateItem(i, "label", e.target.value)}
              className="flex-1 px-2 py-1 bg-white border border-thmanyah-warm-border rounded-lg font-ui font-bold text-[13px] focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40"
            />
            <button
              onClick={() => removeItem(i)}
              className="opacity-0 group-hover:opacity-100 text-thmanyah-muted hover:text-thmanyah-red cursor-pointer p-1 transition-opacity shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={keyPlaceholder}
          dir="ltr"
          className="w-[120px] md:w-[160px] px-3 py-2.5 bg-thmanyah-off-white border border-thmanyah-warm-border rounded-xl font-ui font-bold text-[12px] text-left focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 shrink-0"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder={valuePlaceholder}
          className="flex-1 px-3 py-2.5 bg-thmanyah-off-white border border-thmanyah-warm-border rounded-xl font-ui font-bold text-[13px] focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40"
        />
        <button
          onClick={addItem}
          disabled={!newKey.trim() || !newValue.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-thmanyah-green/10 text-thmanyah-green rounded-xl font-ui font-black text-[12px] hover:bg-thmanyah-green/20 disabled:opacity-40 cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة
        </button>
      </div>
    </div>
  );
}

/* ── TextArea field ── */
function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block font-ui font-black text-[13px] text-thmanyah-charcoal mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 bg-thmanyah-off-white border border-thmanyah-warm-border rounded-xl font-ui font-bold text-[13px] leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-thmanyah-green/40 focus:border-thmanyah-green transition-all"
      />
    </div>
  );
}
