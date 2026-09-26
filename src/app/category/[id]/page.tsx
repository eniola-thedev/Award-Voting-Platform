import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import type { Contestant } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CategoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: settings } = await supabase.from('award_settings').select('award_name').eq('id', 1).single();
  const awardName = settings?.award_name || 'NAQSS AWARD AND PROM NIGHT';

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!category) notFound();

  const { data: contestants } = await supabase
    .from('contestants')
    .select('*')
    .eq('category_id', params.id)
    .eq('status', 'active')
    .order('contestant_number', { ascending: true });

  return (
    <div>
      <SiteHeader awardName={awardName} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/categories" className="text-sm font-medium text-brand-700 hover:underline">
          &larr; All categories
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-neutral-900">{category.name}</h1>
        {category.description && <p className="mt-2 text-neutral-600">{category.description}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {((contestants as Contestant[]) || []).map((c) => (
            <Link key={c.id} href={`/contestant/${c.id}`} className="card flex items-center gap-4 p-4 hover:shadow-md">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                    No photo
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">{c.name}</p>
                <p className="text-xs text-neutral-500">{c.contestant_number}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/vote" className="btn-primary">
            Vote for a Contestant
          </Link>
        </div>
      </main>
      <SiteFooter awardName={awardName} />
    </div>
  );
}
