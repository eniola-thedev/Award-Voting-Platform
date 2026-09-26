'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { generateVotingCode, type GenerateCodeState } from '@/app/admin/actions';
import { formatNaira } from '@/lib/utils';

const initialState: GenerateCodeState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'Generating…' : 'Generate Code'}
    </button>
  );
}

export default function GenerateCodeForm({ pricePerPoint }: { pricePerPoint: number }) {
  const [state, formAction] = useFormState(generateVotingCode, initialState);
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const numericAmount = Number(amount) || 0;
  const points = useMemo(
    () => (numericAmount > 0 && numericAmount % pricePerPoint === 0 ? numericAmount / pricePerPoint : null),
    [numericAmount, pricePerPoint]
  );
  const invalidAmount = numericAmount > 0 && points === null;

  async function handleCopy() {
    if (!state.code) return;
    await navigator.clipboard.writeText(state.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (state.success && state.code) {
    return (
      <div className="card border-2 border-green-200 bg-green-50 p-6 text-center">
        <p className="text-sm font-semibold text-green-700">Voting Code Generated</p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-neutral-900">{state.code}</p>
        <p className="mt-2 text-sm text-neutral-600">
          {formatNaira(state.amount ?? 0)} &middot; {state.points} Voting Points
        </p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={handleCopy} className="btn-secondary flex-1">
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary flex-1">
            Generate Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card p-6">
      <h2 className="font-semibold text-neutral-900">Generate Voting Code</h2>
      <div className="mt-4">
        <label htmlFor="amount" className="label">
          Amount Received
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={pricePerPoint}
          step={pricePerPoint}
          required
          className="input"
          placeholder="₦1,000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <p className="mt-2 text-sm text-neutral-600">
        Voting Points:{' '}
        <strong className="text-neutral-900">
          {points !== null ? points : invalidAmount ? '—' : 0}
        </strong>
      </p>
      {invalidAmount && (
        <p className="mt-1 text-sm font-medium text-red-600">
          Amount must be a multiple of {formatNaira(pricePerPoint)}.
        </p>
      )}
      {state.error && <p className="mt-2 text-sm font-medium text-red-600">{state.error}</p>}
      <div className="mt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
