'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateSettings, type SettingsState } from '@/app/admin/actions';
import type { AwardSettings } from '@/lib/types';

const initialState: SettingsState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Saving…' : 'Save Settings'}
    </button>
  );
}

function toLocalInput(value: string | null): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
}

export default function SettingsForm({ settings }: { settings: AwardSettings }) {
  const [state, formAction] = useFormState(updateSettings, initialState);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <label className="label">Award Show Name</label>
        <input name="award_name" defaultValue={settings.award_name} required className="input" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" defaultValue={settings.description} rows={2} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Voting Price (₦ per point)</label>
          <input
            name="price_per_point"
            type="number"
            min={1}
            defaultValue={settings.price_per_point}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Organizer WhatsApp Number</label>
          <input name="whatsapp_number" defaultValue={settings.whatsapp_number} className="input" placeholder="234..." />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Bank Name</label>
          <input name="bank_name" defaultValue={settings.bank_name} className="input" />
        </div>
        <div>
          <label className="label">Account Name</label>
          <input name="account_name" defaultValue={settings.account_name} className="input" />
        </div>
        <div>
          <label className="label">Account Number</label>
          <input name="account_number" defaultValue={settings.account_number} className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Voting Start</label>
          <input
            name="voting_start"
            type="datetime-local"
            defaultValue={toLocalInput(settings.voting_start)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Voting End</label>
          <input
            name="voting_end"
            type="datetime-local"
            defaultValue={toLocalInput(settings.voting_end)}
            className="input"
          />
        </div>
      </div>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-green-700">Settings saved.</p>}
      <SubmitButton />
    </form>
  );
}
