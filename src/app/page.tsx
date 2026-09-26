import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { formatNaira } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const steps = [
  {
    title: 'Make Payment',
    body: 'Transfer your desired amount to the organizer’s bank account.'
  },
  {
    title: 'Send Receipt',
    body: 'Send your payment receipt to the organizer’s WhatsApp.'
  },
  {
    title: 'Receive Voting Code',
    body: 'The organizer verifies your payment and sends you a unique voting code.'
  },
  {
    title: 'Cast Your Votes',
    body: 'Enter your code and distribute your voting points among contestants.'
  }
];

export default async function HomePage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('award_settings')
    .select('award_name, description, price_per_point')
    .eq('id', 1)
    .single();

  const awardName = settings?.award_name || 'NAQSS AWARD AND PROM NIGHT';
  const pricePerPoint = settings?.price_per_point ?? 100;

  return (
    <div>
      <SiteHeader awardName={awardName} />

      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {awardName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
            {settings?.description || 'Support your favourite contestant.'}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/vote" className="btn-primary w-full sm:w-auto">
              Vote Now
            </Link>
            <Link href="/categories" className="btn-secondary w-full sm:w-auto">
              View Categories
            </Link>
          </div>
          <p className="mt-6 inline-block rounded-full bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white">
            {formatNaira(pricePerPoint)} = 1 Voting Point
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-center font-display text-2xl font-bold text-neutral-900">How Voting Works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/payment" className="text-sm font-semibold text-brand-700 hover:underline">
            View payment details &rarr;
          </Link>
        </div>
      </section>

      <SiteFooter awardName={awardName} />
    </div>
  );
}
