import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = createClient();
  const { data: settings } = await supabase.from('award_settings').select('award_name').eq('id', 1).single();
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  const awardName = settings?.award_name || 'NAQSS AWARD AND PROM NIGHT';

  return (
    <div>
      <SiteHeader awardName={awardName} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-neutral-900">Award Categories</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {((categories as Category[]) || []).map((cat) => (
            <Link key={cat.id} href={`/category/${cat.id}`} className="card p-5 transition hover:shadow-md">
              <h2 className="font-semibold text-neutral-900">{cat.name}</h2>
              {cat.description && <p className="mt-1 text-sm text-neutral-600">{cat.description}</p>}
              <span className="mt-3 inline-block text-sm font-semibold text-brand-700">View contestants &rarr;</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter awardName={awardName} />
    </div>
  );
}
