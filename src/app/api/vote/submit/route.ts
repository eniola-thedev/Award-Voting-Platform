import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeCode } from '@/lib/utils';

type IncomingVote = {
  category_id: string;
  contestant_id: string;
  points: number;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawCode = body?.code;
  const votes: IncomingVote[] = body?.votes;

  if (!rawCode || typeof rawCode !== 'string') {
    return NextResponse.json({ error: 'Missing voting code.' }, { status: 400 });
  }

  if (!Array.isArray(votes) || votes.length === 0) {
    return NextResponse.json({ error: 'No votes were submitted.' }, { status: 400 });
  }

  // Basic shape validation — the database function performs the authoritative checks.
  for (const v of votes) {
    if (
      typeof v.category_id !== 'string' ||
      typeof v.contestant_id !== 'string' ||
      typeof v.points !== 'number' ||
      !Number.isInteger(v.points) ||
      v.points <= 0
    ) {
      return NextResponse.json({ error: 'Malformed vote entry.' }, { status: 400 });
    }
  }

  const code = normalizeCode(rawCode);
  const supabase = createClient();

  const { data, error } = await supabase.rpc('submit_votes', {
    p_code: code,
    p_votes: votes
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    voteReference: row.vote_reference,
    remainingPoints: row.remaining_points
  });
}
