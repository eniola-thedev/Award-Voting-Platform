import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { formatNaira, whatsappLink } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PaymentPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('award_settings')
    .select('award_name, bank_name, account_name, account_number, whatsapp_number, price_per_point')
    .eq('id', 1)
    .single();

  const awardName = settings?.award_name || 'NAQSS AWARD AND PROM NIGHT';
  const message =
    'Hello, I have made my payment for the award voting. Please verify my payment and send me my voting code.';
  const waLink = settings?.whatsapp_number ? whatsappLink(settings.whatsapp_number, message) : null;

  return (
    <div>
      <SiteHeader awardName={awardName} />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-neutral-900">Payment Information</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Transfer your desired amount, then send your receipt on WhatsApp to receive your voting code.
        </p>

        <div className="card mt-6 divide-y divide-neutral-100 p-6">
          <Row label="Bank Name" value={settings?.bank_name || 'OPAY/PAYCOM'} />
          <Row label="Account Name" value={settings?.account_name || 'Toheeb Adedamola Oyedokun'} />
          <Row label="Account Number" value={settings?.account_number || '9016084309'} />
          <Row label="Voting Price" value={`${formatNaira(settings?.price_per_point ?? 100)} = 1 Point`} />
        </div>

       <a
             href="https://wa.me/2349079087040?text=Hello%2C%20I%20have%20made%20my%20payment%20for%20the%20award%20voting.%20Please%20verify%20my%20payment%20and%20send%20me%20my%20voting%20code."
             target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 w-full"
>
  I Have Made the Transfer
</a>
        

        <p className="mt-2 text-center text-xs text-neutral-500">
          This opens WhatsApp with a message to the organizer. Attach your payment receipt there to get verified
          and receive your voting code.
        </p>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Note: this website does not automatically verify payments. Your payment is confirmed manually by the
          organizer once your receipt is received.
        </p>
      </main>
      <SiteFooter awardName={awardName} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-semibold text-neutral-900">{value}</span>
    </div>
  );
}