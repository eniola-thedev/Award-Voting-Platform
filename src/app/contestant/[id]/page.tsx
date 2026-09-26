import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function ContestantProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: settings } = await supabase.from('award_settings').select('award_name').eq('id', 1).single();
  const awardName = settings?.award_name || 'NAQSS AWARD AND PROM NIGHT';

  const { data: contestant } = await supabase
    .from('contestants')
    .select('*, categories(name, id)')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!contestant) notFound();

  return (
    <div>
      <SiteHeader awardName={awardName} />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href={`/category/${contestant.categories?.id}`}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          &larr; {contestant.categories?.name}
        </Link>

        <div className="card mt-4 overflow-hidden">
          <div className="aspect-square w-full bg-neutral-100">
            {contestant.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contestant.image_url} alt={contestant.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                No photo available
              </div>
            )}
          </div>
          <div className="p-6">
            <p className="text-sm font-semibold text-brand-700">{contestant.contestant_number}</p>
            <h1 className="font-display text-3xl font-bold text-neutral-900">{contestant.name}</h1>
            {contestant.description && <p className="mt-3 text-neutral-600">{contestant.description}</p>}
            <Link href="/vote" className="btn-primary mt-6 inline-flex">
              Vote for {contestant.name.split(' ')[0]}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter awardName={awardName} />
    </div>
  );
}
