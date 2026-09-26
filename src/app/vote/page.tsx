import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import VotingFlow from '@/components/VotingFlow';
import type { Category, Contestant } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function VotePage() {
  const supabase = createClient();

  const { data: settings } = await supabase.from('award_settings').select('award_name').eq('id', 1).single();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  const { data: contestants } = await supabase
    .from('contestants')
    .select('*')
    .eq('status', 'active')
    .order('contestant_number', { ascending: true });

  const contestantsByCategory: Record<string, Contestant[]> = {};
  for (const c of (contestants as Contestant[]) || []) {
    if (!contestantsByCategory[c.category_id]) contestantsByCategory[c.category_id] = [];
    contestantsByCategory[c.category_id].push(c);
  }

  return (
    <div>
      <SiteHeader awardName={settings?.award_name || 'NAQSS AWARD AND PROM NIGHT'} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <VotingFlow categories={(categories as Category[]) || []} contestantsByCategory={contestantsByCategory} />
      </main>
      <SiteFooter awardName={settings?.award_name || 'NAQSS AWARD AND PROM NIGHT'} />
    </div>
  );
}
