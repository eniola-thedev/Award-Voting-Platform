import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeCode } from '@/lib/utils';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawCode = body?.code;

  if (!rawCode || typeof rawCode !== 'string') {
    return NextResponse.json({ error: 'Please enter your voting code.' }, { status: 400 });
  }

  const code = normalizeCode(rawCode);
  const supabase = createClient();

  const { data, error } = await supabase.rpc('validate_voting_code', { p_code: code });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return NextResponse.json({ error: 'Invalid voting code.' }, { status: 400 });
  }

  return NextResponse.json({
    code: row.code,
    totalPoints: row.total_points,
    usedPoints: row.used_points,
    remainingPoints: row.remaining_points,
    status: row.status
  });
}
