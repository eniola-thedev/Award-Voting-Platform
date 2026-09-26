import { createClient } from '@/lib/supabase/server';
import SettingsForm from '@/components/SettingsForm';
import { setVotingStatus } from '../../actions';
import type { AwardSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase.from('award_settings').select('*').eq('id', 1).single();

  const votingOpen = settings?.voting_status === 'open';

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Settings</h1>

      <div className="mt-6 card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold text-neutral-900">Voting Status</p>
          <p className="text-sm text-neutral-500">
            Voting is currently{' '}
            <strong className={votingOpen ? 'text-green-700' : 'text-red-600'}>
              {votingOpen ? 'OPEN' : 'CLOSED'}
            </strong>
            .
          </p>
        </div>
        <form action={setVotingStatus.bind(null, votingOpen ? 'closed' : 'open')}>
          <button type="submit" className={votingOpen ? 'btn-secondary' : 'btn-primary'}>
            {votingOpen ? 'Close Voting' : 'Open Voting'}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <SettingsForm settings={settings as AwardSettings} />
      </div>
    </div>
  );
}
