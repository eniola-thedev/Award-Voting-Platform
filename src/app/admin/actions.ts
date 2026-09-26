'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  return { supabase, user };
}

// ---------------- AUTH ----------------

export type SignInState = { error?: string };

export async function adminSignIn(
  prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/admin');
}

export async function adminSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

// ---------------- VOTING CODES ----------------

export type GenerateCodeState = {
  error?: string;
  success?: boolean;
  code?: string;
  amount?: number;
  points?: number;
};

export async function generateVotingCode(
  prevState: GenerateCodeState,
  formData: FormData
): Promise<GenerateCodeState> {
  const { supabase } = await requireAdmin();
  const amount = Number(formData.get('amount'));

  if (!amount || amount <= 0) {
    return { error: 'Enter a valid amount.' };
  }

  const { data, error } = await supabase.rpc(
    'admin_create_voting_code',
    { p_amount: amount }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/codes');
  revalidatePath('/admin');

  const row = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    code: row.code,
    amount: row.amount,
    points: row.total_points
  };
}

export async function disableVotingCode(codeId: string) {
  const { supabase } = await requireAdmin();

  await supabase
    .from('voting_codes')
    .update({ status: 'disabled' })
    .eq('id', codeId);

  revalidatePath('/admin/codes');
}

export async function reactivateVotingCode(codeId: string) {
  const { supabase } = await requireAdmin();

  const { data: row } = await supabase
    .from('voting_codes')
    .select('used_points, total_points')
    .eq('id', codeId)
    .single();

  if (!row) return;

  const status =
    row.used_points >= row.total_points
      ? 'used'
      : row.used_points > 0
        ? 'partially_used'
        : 'active';

  await supabase
    .from('voting_codes')
    .update({ status })
    .eq('id', codeId);

  revalidatePath('/admin/codes');
}

// ---------------- CATEGORIES ----------------

export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();

  if (!name) return;

  await supabase
    .from('categories')
    .insert({ name, description });

  revalidatePath('/admin/categories');
}

export async function toggleCategoryStatus(
  categoryId: string,
  currentStatus: string
) {
  const { supabase } = await requireAdmin();

  const next =
    currentStatus === 'active' ? 'inactive' : 'active';

  await supabase
    .from('categories')
    .update({ status: next })
    .eq('id', categoryId);

  revalidatePath('/admin/categories');
}

export async function deleteCategory(categoryId: string) {
  const { supabase } = await requireAdmin();

  await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  revalidatePath('/admin/categories');
}

// ---------------- CONTESTANTS ----------------

export async function createContestant(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get('name') || '').trim();
  const category_id = String(formData.get('category_id') || '');
  const description = String(formData.get('description') || '').trim();
  const imageFile = formData.get('image') as File | null;

  if (!name || !category_id) {
    return;
  }

  /*
   * Find the highest contestant number already used
   * in this category.
   *
   * Example:
   * #001
   * #002
   * #007
   *
   * Next contestant = #008
   */

  const { data: existingContestants, error: contestantsError } =
    await supabase
      .from('contestants')
      .select('contestant_number')
      .eq('category_id', category_id);

  if (contestantsError) {
    throw new Error(contestantsError.message);
  }

  let highestNumber = 0;

  for (const contestant of existingContestants || []) {
    const number = parseInt(
      String(contestant.contestant_number || '').replace('#', ''),
      10
    );

    if (!isNaN(number) && number > highestNumber) {
      highestNumber = number;
    }
  }

  const nextNumber = highestNumber + 1;

  const contestant_number = `#${String(nextNumber).padStart(3, '0')}`;

  // ---------------- IMAGE UPLOAD ----------------

  let image_url: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop();

    const path = `contestants/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('contestant-images')
      .upload(path, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage
        .from('contestant-images')
        .getPublicUrl(path);

      image_url = publicUrl.publicUrl;
    }
  }

  // ---------------- CREATE CONTESTANT ----------------

  const { error: insertError } = await supabase
    .from('contestants')
    .insert({
      name,
      contestant_number,
      category_id,
      description,
      image_url
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath('/admin/contestants');
}

// ---------------- CONTESTANT STATUS ----------------

export async function toggleContestantStatus(
  contestantId: string,
  currentStatus: string
) {
  const { supabase } = await requireAdmin();

  const next =
    currentStatus === 'active' ? 'inactive' : 'active';

  await supabase
    .from('contestants')
    .update({ status: next })
    .eq('id', contestantId);

  revalidatePath('/admin/contestants');
}

export async function deleteContestant(contestantId: string) {
  const { supabase } = await requireAdmin();

  await supabase
    .from('contestants')
    .delete()
    .eq('id', contestantId);

  revalidatePath('/admin/contestants');
}

// ---------------- SETTINGS ----------------

export type SettingsState = {
  error?: string;
  success?: boolean;
};

export async function updateSettings(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { supabase } = await requireAdmin();

  const payload = {
    award_name: String(formData.get('award_name') || ''),
    description: String(formData.get('description') || ''),
    price_per_point:
      Number(formData.get('price_per_point')) || 100,
    whatsapp_number: String(
      formData.get('whatsapp_number') || ''
    ),
    bank_name: String(formData.get('bank_name') || ''),
    account_name: String(
      formData.get('account_name') || ''
    ),
    account_number: String(
      formData.get('account_number') || ''
    ),
    voting_start: formData.get('voting_start')
      ? new Date(
          String(formData.get('voting_start'))
        ).toISOString()
      : null,
    voting_end: formData.get('voting_end')
      ? new Date(
          String(formData.get('voting_end'))
        ).toISOString()
      : null
  };

  const { error } = await supabase
    .from('award_settings')
    .update(payload)
    .eq('id', 1);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');

  return { success: true };
}

export async function setVotingStatus(
  status: 'open' | 'closed'
) {
  const { supabase } = await requireAdmin();

  await supabase
    .from('award_settings')
    .update({ voting_status: status })
    .eq('id', 1);

  revalidatePath('/', 'layout');
}