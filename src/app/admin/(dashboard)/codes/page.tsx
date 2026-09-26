import { createClient } from '@/lib/supabase/server';
import GenerateCodeForm from '@/components/GenerateCodeForm';
import { disableVotingCode, reactivateVotingCode } from '../../actions';
import { formatNaira, formatDate } from '@/lib/utils';
import type { VotingCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  partially_used: 'bg-amber-100 text-amber-700',
  used: 'bg-neutral-200 text-neutral-600',
  expired: 'bg-neutral-200 text-neutral-600',
  disabled: 'bg-red-100 text-red-700'
};

export default async function AdminCodesPage({
  searchParams
}: {
  searchParams: { q?: string; status?: string };
}) {
  const supabase = createClient();
  const { data: settings } = await supabase.from('award_settings').select('price_per_point').eq('id', 1).single();

  let query = supabase.from('voting_codes').select('*').order('created_at', { ascending: false });

  if (searchParams.q) {
    query = query.ilike('code', `%${searchParams.q}%`);
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  const { data: codes } = await query.limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Voting Codes</h1>
      <p className="mt-1 text-sm text-neutral-500">Generate a code after verifying a payment on WhatsApp.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <GenerateCodeForm pricePerPoint={settings?.price_per_point ?? 100} />

        <div className="card p-5">
          <form className="mb-4 flex flex-wrap gap-3" method="GET">
            <input
              type="text"
              name="q"
              placeholder="Search by code…"
              defaultValue={searchParams.q}
              className="input max-w-xs"
            />
            <select name="status" defaultValue={searchParams.status || ''} className="input max-w-[180px]">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="partially_used">Partially Used</option>
              <option value="used">Used</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
            </select>
            <button type="submit" className="btn-secondary">
              Filter
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Points</th>
                  <th className="py-2 pr-4">Used</th>
                  <th className="py-2 pr-4">Remaining</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {((codes as VotingCode[]) || []).map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 pr-4 font-mono font-semibold">{c.code}</td>
                    <td className="py-2 pr-4">{formatNaira(c.amount)}</td>
                    <td className="py-2 pr-4">{c.total_points}</td>
                    <td className="py-2 pr-4">{c.used_points}</td>
                    <td className="py-2 pr-4">{c.remaining_points}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[c.status]}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-neutral-500">{formatDate(c.created_at)}</td>
                    <td className="py-2 pr-4">
                      {c.status === 'disabled' ? (
                        <form action={reactivateVotingCode.bind(null, c.id)}>
                          <button className="text-xs font-semibold text-brand-700 hover:underline">Reactivate</button>
                        </form>
                      ) : (
                        c.status !== 'used' && (
                          <form action={disableVotingCode.bind(null, c.id)}>
                            <button className="text-xs font-semibold text-red-600 hover:underline">Disable</button>
                          </form>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {(!codes || codes.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-neutral-500">
                      No voting codes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
