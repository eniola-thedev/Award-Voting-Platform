import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminVotesPage({
  searchParams
}: {
  searchParams: { category?: string; code?: string };
}) {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('id, name').order('sort_order');

  let query = supabase
    .from('votes')
    .select('id, vote_reference, points, created_at, categories(name), contestants(name), voting_codes(code)')
    .order('created_at', { ascending: false })
    .limit(300);

  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category);
  }

  const { data: votes } = await query;

  const filtered = searchParams.code
    ? (votes || []).filter((v: any) => v.voting_codes?.code?.toLowerCase().includes(searchParams.code!.toLowerCase()))
    : votes;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Votes</h1>

      <form className="mt-4 mb-4 flex flex-wrap gap-3" method="GET">
        <select name="category" defaultValue={searchParams.category || ''} className="input max-w-[220px]">
          <option value="">All categories</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="code"
          placeholder="Filter by voting code…"
          defaultValue={searchParams.code}
          className="input max-w-xs"
        />
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      <div className="card overflow-x-auto p-5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-4">Vote ID</th>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Contestant</th>
              <th className="py-2 pr-4">Points</th>
              <th className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(filtered || []).map((v: any) => (
              <tr key={v.id}>
                <td className="py-2 pr-4 font-mono">{v.vote_reference}</td>
                <td className="py-2 pr-4 font-mono">{v.voting_codes?.code}</td>
                <td className="py-2 pr-4">{v.categories?.name}</td>
                <td className="py-2 pr-4">{v.contestants?.name}</td>
                <td className="py-2 pr-4 font-semibold">{v.points}</td>
                <td className="py-2 pr-4 text-neutral-500">{formatDate(v.created_at)}</td>
              </tr>
            ))}
            {(!filtered || filtered.length === 0) && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-500">
                  No votes recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
