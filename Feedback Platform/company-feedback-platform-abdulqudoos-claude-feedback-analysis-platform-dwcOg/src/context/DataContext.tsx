'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PlatformData, CleanedData, DataQualityReport, Employee } from '@/lib/types';
import { parseFile, parseBuffer } from '@/lib/parser';
import { cleanPlatformData } from '@/lib/data-cleaning';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface DataContextType {
  data: PlatformData;
  cleanedData: CleanedData | null;
  qualityReport: DataQualityReport | null;
  isLoading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<{ type: string; count: number }>;
  clearData: () => void;
  hasData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DATA_FILES = [
  '/data/employees.csv',
  '/data/probation.csv',
  '/data/ananas.xlsx',
  '/data/leaders.xlsx',
];

// ── Supabase hydration ─────────────────────────────────────────────
// Pull the employees directory from the unified Thmanyah `feedback`
// schema and merge it onto whatever was loaded from the static CSVs.
// Rows from Supabase win for matching ids. If the DB is empty or
// unreachable the CSV copy stays untouched, so the tool keeps working
// offline and during fresh deploys that haven't been seeded yet.
async function hydrateEmployeesFromSupabase(): Promise<Employee[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .schema('feedback')
      .from('employees')
      .select('*');
    if (error) throw error;
    if (!data || data.length === 0) return null;

    return (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id || ''),
      name: String(row.name || ''),
      preferredName: String(row.preferred_name || ''),
      department: String(row.department || ''),
      team: String(row.team || ''),
      level: Number(row.level) || 0,
      jobTitleAr: String(row.job_title_ar || ''),
      jobTitleEn: String(row.job_title_en || ''),
      manager: String(row.manager || ''),
      office: String(row.office || ''),
      startDate: row.start_date ? String(row.start_date) : '',
      currentLocation: String(row.current_location || ''),
      workType: String(row.work_type || ''),
      inProbation: Boolean(row.in_probation),
      lastPromotionDate: row.last_promotion_date ? String(row.last_promotion_date) : '',
      serviceMonths: Number(row.service_months) || 0,
      serviceYears: Number(row.service_years) || 0,
      currentContract: String(row.current_contract || ''),
      contractDaysRemaining: Number(row.contract_days_remaining) || 0,
      contractEndDate: row.contract_end_date ? String(row.contract_end_date) : '',
      isLeader: Boolean(row.is_leader),
      overallRating: String(row.overall_rating || ''),
      gender: String(row.gender || ''),
      nationality: String(row.nationality || ''),
      birthDate: row.birth_date ? String(row.birth_date) : '',
      age: Number(row.age) || 0,
      phone: String(row.phone || ''),
      workEmail: String(row.work_email || ''),
      personalEmail: String(row.personal_email || ''),
    }));
  } catch (err) {
    console.warn('[feedback-platform] Supabase employee hydrate skipped:', err);
    return null;
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlatformData>({ employees: [], evaluations: [], reviews: [], leaders: [], stationMeetings: [], retentionFlags: [], leaderAnalyses: [] });
  const [cleanedData, setCleanedData] = useState<CleanedData | null>(null);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-load data files on mount
  useEffect(() => {
    let cancelled = false;

    async function loadStaticData() {
      const newData: PlatformData = { employees: [], evaluations: [], reviews: [], leaders: [], stationMeetings: [], retentionFlags: [], leaderAnalyses: [] };

      for (const path of DATA_FILES) {
        try {
          const res = await fetch(path);
          if (!res.ok) continue;
          const buffer = await res.arrayBuffer();
          const result = parseBuffer(buffer);

          if (result.type === 'employees' && result.employees) {
            newData.employees.push(...result.employees);
          } else if (result.type === 'evaluations' && result.evaluations) {
            newData.evaluations.push(...result.evaluations);
          } else if (result.type === 'reviews' && result.reviews) {
            newData.reviews.push(...result.reviews);
          } else if (result.type === 'leaders' && result.leaders) {
            newData.leaders.push(...result.leaders);
          }
          if (result.stationMeetings) newData.stationMeetings.push(...result.stationMeetings);
          if (result.retentionFlags) newData.retentionFlags.push(...result.retentionFlags);
          if (result.leaderAnalyses) newData.leaderAnalyses.push(...result.leaderAnalyses);
        } catch {
          // Skip files that fail to load
        }
      }

      // Merge Supabase employees on top of CSV employees. Any DB row
      // with a matching id replaces the CSV copy; brand-new DB rows
      // are appended. If the DB has nothing, the CSV copy stands.
      const dbEmployees = await hydrateEmployeesFromSupabase();
      if (dbEmployees && dbEmployees.length > 0) {
        const byId = new Map(newData.employees.map((e) => [e.id, e]));
        for (const e of dbEmployees) byId.set(e.id, e);
        newData.employees = Array.from(byId.values());
      }

      if (!cancelled) {
        setData(newData);
        setIsLoading(false);
      }
    }

    loadStaticData();
    return () => { cancelled = true; };
  }, []);

  // Re-run cleaning pipeline when data changes (e.g., after file upload)
  useEffect(() => {
    if (data.employees.length > 0 || data.evaluations.length > 0) {
      const cleaned = cleanPlatformData(data);
      setCleanedData(cleaned);
      setQualityReport(cleaned.qualityReport);
    }
  }, [data]);

  const uploadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await parseFile(file);

      if (result.error) {
        setError(result.error);
        return { type: 'error', count: 0 };
      }

      if (result.type === 'employees' && result.employees) {
        setData(prev => ({ ...prev, employees: [...prev.employees, ...result.employees!] }));
        return { type: 'employees', count: result.employees.length };
      }

      if (result.type === 'evaluations' && result.evaluations) {
        setData(prev => ({ ...prev, evaluations: [...prev.evaluations, ...result.evaluations!] }));
        return { type: 'evaluations', count: result.evaluations.length };
      }

      if (result.type === 'reviews' && result.reviews) {
        setData(prev => ({
          ...prev,
          reviews: [...prev.reviews, ...result.reviews!],
          stationMeetings: [...prev.stationMeetings, ...(result.stationMeetings || [])],
          retentionFlags: [...prev.retentionFlags, ...(result.retentionFlags || [])],
        }));
        return { type: 'reviews', count: result.reviews.length };
      }

      if (result.type === 'leaders' && result.leaders) {
        setData(prev => ({
          ...prev,
          leaders: [...prev.leaders, ...result.leaders!],
          leaderAnalyses: [...prev.leaderAnalyses, ...(result.leaderAnalyses || [])],
        }));
        return { type: 'leaders', count: result.leaders.length };
      }

      setError('لم يتم التعرف على نوع الملف');
      return { type: 'unknown', count: 0 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData({ employees: [], evaluations: [], reviews: [], leaders: [], stationMeetings: [], retentionFlags: [], leaderAnalyses: [] });
    setCleanedData(null);
    setQualityReport(null);
    setError(null);
  }, []);

  const hasData = data.employees.length > 0 || data.evaluations.length > 0 || data.reviews.length > 0 || data.leaders.length > 0;

  return (
    <DataContext.Provider value={{ data, cleanedData, qualityReport, isLoading, error, uploadFile, clearData, hasData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
