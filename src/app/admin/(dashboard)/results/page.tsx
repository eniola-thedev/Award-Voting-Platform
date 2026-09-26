import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

type ResultRow = {
  contestant_id: string;
  contestant_name: string;
  contestant_number: string;
  category_id: string;
  category_name: string;
  total_points: number;
};

export default async function AdminResultsPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
  const { data: results } = await supabase
    .from('contestant_results')
    .select('*')
    .order('total_points', { ascending: false });

  const byCategory: Record<string, ResultRow[]> = {};
  for (const row of (results as ResultRow[]) || []) {
    if (!byCategory[row.category_id]) byCategory[row.category_id] = [];
    byCategory[row.category_id].push(row);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Results</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Calculated live from vote records — not an editable total.
      </p>

      <div className="mt-6 space-y-8">
        {((categories as Category[]) || []).map((cat) => {
          const rows = byCategory[cat.id] || [];
          const max = Math.max(1, ...rows.map((r) => r.total_points));
          return (
            <div key={cat.id} className="card p-5">
              <h2 className="font-semibold uppercase tracking-wide text-neutral-900">{cat.name}</h2>
              <div className="mt-4 space-y-3">
                {rows.map((r) => (
                  <div key={r.contestant_id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-800">
                        {r.contestant_number} {r.contestant_name}
                      </span>
                      <span className="font-bold text-neutral-900">{r.total_points.toLocaleString()} pts</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-brand-700"
                        style={{ width: `${(r.total_points / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {rows.length === 0 && <p className="text-sm text-neutral-500">No votes yet.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
