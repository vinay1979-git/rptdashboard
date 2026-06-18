'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import { FeatureData, TaskData, RiskIssueData } from '@/app/utils/reportEngine';

export interface Report {
  id: string;
  created_at: string;
  created_by?: string;
  highlights: string[];
  features_data: {
    title: string;
    features: FeatureData[];
  };
  tasks_data: TaskData[];
  risks_data: RiskIssueData[];
  issues_data: RiskIssueData[];
  report_type: string;
}

export interface HistoricalReportSummary {
  id: string;
  created_at: string;
  title: string;
  report_type: string;
}

export async function fetchReports(selectedReportType: string = 'Product Grow report') {
  const supabase = await createClient();
  let query = supabase
    .from('reports')
    .select('id, features_data, created_at, report_type');

  if (selectedReportType === 'Product Grow report') {
    query = query.or(`report_type.eq."${selectedReportType}",report_type.is.null`);
  } else {
    query = query.eq('report_type', selectedReportType);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching historical reports:', error);
    return [];
  }
  
  return (data || []).map(r => {
    const type = r.report_type || 'Product Grow report';
    return {
      id: r.id,
      created_at: r.created_at,
      title: (r.features_data as { title: string })?.title || 'Executive Status Report',
      report_type: type
    };
  });
}

export async function saveReport(
  title: string,
  highlights: string[],
  featuresData: FeatureData[],
  tasksData: TaskData[],
  risksData: RiskIssueData[],
  issuesData: RiskIssueData[],
  reportType: string
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. User session not found. Please log in.' };
  }

  const { data: newReport, error } = await supabase
    .from('reports')
    .insert({
      created_by: user.id,
      highlights,
      features_data: {
        title,
        features: featuresData
      },
      tasks_data: tasksData,
      risks_data: risksData,
      issues_data: issuesData,
      report_type: reportType
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving report to database:', error.message);
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { id: newReport.id };
}

export async function deleteReportAction(reportId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. User session not found. Please log in.' };
  }

  // 1. Fetch report details using admin client to find the owner
  const adminClient = createAdminClient();
  const { data: report, error: fetchError } = await adminClient
    .from('reports')
    .select('created_by')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) {
    return { error: 'Report not found.' };
  }

  // 2. Check authorization: user is owner or an admin
  let canDelete = report.created_by === user.id;

  if (!canDelete) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile && profile.is_admin) {
      canDelete = true;
    }
  }

  if (!canDelete) {
    return { error: 'Permission denied. Only the report creator or an admin can delete it.' };
  }

  // 3. Delete the report using adminClient
  const { error: deleteError } = await adminClient
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (deleteError) {
    console.error('Error deleting report:', deleteError.message);
    return { error: deleteError.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
