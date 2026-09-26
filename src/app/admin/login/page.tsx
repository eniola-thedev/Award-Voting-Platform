'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { adminSignIn, type SignInState } from '../actions';

const initialState: SignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(adminSignIn, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="font-display text-xl font-bold text-brand-700">Admin Sign In</h1>
        <p className="mt-1 text-sm text-neutral-500">NAQSS Award and Prom Night dashboard</p>
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input id="password" name="password" type="password" required className="input" />
          </div>
          {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
