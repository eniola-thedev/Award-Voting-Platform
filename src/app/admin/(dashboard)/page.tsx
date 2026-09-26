import { createClient } from '@/lib/supabase/server';
import { formatNaira } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [{ count: totalCodes }, { data: codesAgg }, { count: totalVotes }, { count: activeCategories }, { count: totalContestants }] =
    await Promise.all([
      supabase.from('voting_codes').select('*', { count: 'exact', head: true }),
      supabase.from('voting_codes').select('amount, total_points, used_points'),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('contestants').select('*', { count: 'exact', head: true })
    ]);

  const totalMoney = (codesAgg || []).reduce((sum, c) => sum + c.amount, 0);
  const pointsGenerated = (codesAgg || []).reduce((sum, c) => sum + c.total_points, 0);
  const pointsUsed = (codesAgg || []).reduce((sum, c) => sum + c.used_points, 0);
  const pointsRemaining = pointsGenerated - pointsUsed;

  const stats = [
    { label: 'Total Money Received', value: formatNaira(totalMoney) },
    { label: 'Voting Points Generated', value: pointsGenerated.toLocaleString() },
    { label: 'Points Used', value: pointsUsed.toLocaleString() },
    { label: 'Points Remaining', value: pointsRemaining.toLocaleString() },
    { label: 'Voting Codes', value: (totalCodes ?? 0).toLocaleString() },
    { label: 'Total Votes Cast', value: (totalVotes ?? 0).toLocaleString() },
    { label: 'Active Categories', value: (activeCategories ?? 0).toLocaleString() },
    { label: 'Total Contestants', value: (totalContestants ?? 0).toLocaleString() }
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">Overview of NAQSS Award and Prom Night voting.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-5">
        <h2 className="font-semibold text-neutral-900">Quick Action</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Verified a payment? Generate a voting code and send it to the voter on WhatsApp.
        </p>
        <a href="/admin/codes" className="btn-primary mt-4 inline-flex">
          Generate Voting Code
        </a>
      </div>
    </div>
  );
}
