'use client';

import { useMemo, useState } from 'react';
import { normalizeCode } from '@/lib/utils';
import type { Category, Contestant } from '@/lib/types';

type Props = {
  categories: Category[];
  contestantsByCategory: Record<string, Contestant[]>;
};

type Step = 'code' | 'voting' | 'review' | 'success';

export default function VotingFlow({ categories, contestantsByCategory }: Props) {
  const [step, setStep] = useState<Step>('code');
  const [codeInput, setCodeInput] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0); // remaining_points from the server at load time
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ reference: string; remaining: number } | null>(null);

  const allocatedTotal = useMemo(
    () => Object.values(allocations).reduce((sum, n) => sum + n, 0),
    [allocations]
  );
  const pointsLeft = availablePoints - allocatedTotal;

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/vote/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid voting code.');
      }
      setCode(data.code);
      setTotalPoints(data.totalPoints);
      setAvailablePoints(data.remainingPoints);
      setAllocations({});
      setStep('voting');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function adjustPoints(contestantId: string, delta: number) {
    setAllocations((prev) => {
      const current = prev[contestantId] || 0;
      const next = current + delta;
      if (next < 0) return prev;
      const wouldBeTotal = allocatedTotal - current + next;
      if (wouldBeTotal > availablePoints) return prev;
      const updated = { ...prev, [contestantId]: next };
      if (next === 0) delete updated[contestantId];
      return updated;
    });
  }

  async function handleFinalSubmit() {
    if (!code) return;
    setError(null);
    setLoading(true);
    try {
      const votes = Object.entries(allocations).map(([contestantId, points]) => {
        const categoryId = Object.keys(contestantsByCategory).find((catId) =>
          contestantsByCategory[catId].some((c) => c.id === contestantId)
        )!;
        return { category_id: categoryId, contestant_id: contestantId, points };
      });

      const res = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, votes })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit your votes.');
      }
      setSuccessData({ reference: data.voteReference, remaining: data.remainingPoints });
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function contestantName(id: string): string {
    for (const list of Object.values(contestantsByCategory)) {
      const found = list.find((c) => c.id === id);
      if (found) return found.name;
    }
    return 'Unknown';
  }

  function categoryName(id: string): string {
    return categories.find((c) => c.id === id)?.name || '';
  }

  // ---------- STEP: enter code ----------
  if (step === 'code') {
    return (
      <div className="mx-auto max-w-md">
        <div className="card p-6">
          <h1 className="font-display text-2xl font-bold text-brand-700">Enter Your Voting Code</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Enter the code the organizer sent you on WhatsApp after verifying your payment.
          </p>
          <form onSubmit={handleCodeSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="code" className="label">
                Voting Code
              </label>
              <input
                id="code"
                className="input text-center text-lg font-semibold tracking-widest"
                placeholder="AWD-________"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button type="submit" disabled={loading || !codeInput.trim()} className="btn-primary w-full">
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- STEP: allocate points ----------
  if (step === 'voting') {
    return (
      <div className="mx-auto max-w-3xl pb-32">
        <div className="sticky top-16 z-20 mb-6 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Available: <strong>{availablePoints}</strong>
            </span>
            <span>
              Allocated: <strong>{allocatedTotal}</strong>
            </span>
            <span>
              Remaining: <strong className={pointsLeft === 0 ? 'text-green-700' : ''}>{pointsLeft}</strong>
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <div className="space-y-10">
          {categories.map((cat) => (
            <section key={cat.id}>
              <h2 className="mb-3 font-display text-xl font-bold text-neutral-900">{cat.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(contestantsByCategory[cat.id] || []).map((contestant) => (
                  <div key={contestant.id} className="card flex items-center gap-4 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {contestant.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={contestant.image_url}
                          alt={contestant.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{contestant.name}</p>
                      <p className="text-xs text-neutral-500">{contestant.contestant_number}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => adjustPoints(contestant.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 text-lg font-bold text-neutral-700 hover:bg-neutral-50"
                          aria-label={`Decrease points for ${contestant.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-base font-semibold">
                          {allocations[contestant.id] || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustPoints(contestant.id, 1)}
                          disabled={pointsLeft <= 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 text-lg font-bold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Increase points for ${contestant.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <p className="text-sm text-neutral-600">
              {allocatedTotal} / {availablePoints} points allocated
            </p>
            <button
              type="button"
              disabled={allocatedTotal === 0}
              onClick={() => setStep('review')}
              className="btn-primary"
            >
              Review Votes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- STEP: review & confirm ----------
  if (step === 'review') {
    return (
      <div className="mx-auto max-w-md pb-10">
        <div className="card p-6">
          <h1 className="font-display text-2xl font-bold text-brand-700">Review Your Votes</h1>
          <div className="mt-4 divide-y divide-neutral-100">
            {Object.entries(allocations).map(([contestantId, points]) => (
              <div key={contestantId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{contestantName(contestantId)}</p>
                  <p className="text-xs text-neutral-500">
                    {categoryName(
                      Object.keys(contestantsByCategory).find((catId) =>
                        contestantsByCategory[catId].some((c) => c.id === contestantId)
                      ) || ''
                    )}
                  </p>
                </div>
                <p className="text-sm font-bold text-brand-700">{points} pts</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 text-sm">
            <span className="font-medium text-neutral-600">Total</span>
            <span className="font-bold">{allocatedTotal} points</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-600">Remaining after this vote</span>
            <span className="font-bold">{pointsLeft} points</span>
          </div>

          {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep('voting')} className="btn-secondary flex-1">
              Back
            </button>
            <button type="button" onClick={handleFinalSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Submitting…' : 'Confirm & Submit Votes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- STEP: success ----------
  if (step === 'success' && successData) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
            ✓
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Vote Submitted Successfully</h1>
          <p className="mt-2 text-sm text-neutral-600">
            You have successfully used {allocatedTotal} voting points.
          </p>
          <p className="mt-4 rounded-xl bg-neutral-50 py-3 text-sm font-semibold tracking-wide text-neutral-800">
            Vote Reference: {successData.reference}
          </p>
          <div className="mt-4 divide-y divide-neutral-100 text-left">
            {Object.entries(allocations).map(([contestantId, points]) => (
              <div key={contestantId} className="flex items-center justify-between py-2 text-sm">
                <span>{contestantName(contestantId)}</span>
                <span className="font-semibold">{points} pts</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-neutral-600">Remaining Points: {successData.remaining}</p>
          {successData.remaining > 0 ? (
            <button
              type="button"
              className="btn-primary mt-6 w-full"
              onClick={() => {
                setAvailablePoints(successData.remaining);
                setAllocations({});
                setStep('voting');
              }}
            >
              Vote With Remaining Points
            </button>
          ) : (
            <p className="mt-6 font-medium text-brand-700">Thank you for voting.</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
