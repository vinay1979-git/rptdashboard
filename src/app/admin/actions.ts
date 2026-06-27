'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function registerUser(email: string) {
  if (!email) {
    return { error: 'Email is required.' };
  }

  // 1. Verify current user session and admin credentials
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized. Please log in.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return { error: 'Forbidden. Admin privileges required.' };
  }

  // 2. Initialize the admin client to bypass standard RLS constraints
  const adminSupabase = createAdminClient();

  // 3. Send an invite link so the user sets their own password on first login
  const { data: provisionedData, error: provisionError } = await adminSupabase.auth.admin.generateLink({
    type: 'invite',
    email,
  });

  if (provisionError) {
    return { error: provisionError.message };
  }

  if (provisionedData && provisionedData.user) {
    // 4. Ensure profile row is generated (matching the trigger configuration)
    const isAdminEmail = email === 'vinay1979@gmail.com' || email === 'vinayvis@lentra.ai';

    await adminSupabase.from('profiles').upsert({
      id: provisionedData.user.id,
      email: email,
      is_admin: isAdminEmail
    });
  }

  revalidatePath('/admin');
  return { success: `Invite email sent to ${email}. They'll be prompted to set their own password on first login.` };
}
