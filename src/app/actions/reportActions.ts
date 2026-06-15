'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchReports() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching historical reports:', error);
    return [];
  }
  return data || [];
}

export async function saveReport(title: string, reportPayload: any) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. User session not found. Please log in.' };
  }

  const { data: newReport, error } = await supabase
    .from('reports')
    .insert({
      title,
      created_by: user.id,
      data: reportPayload,
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
