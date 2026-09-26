import { createClient } from '@/lib/supabase/server';
import { createContestant, toggleContestantStatus, deleteContestant } from '../../actions';
import type { Category, Contestant } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminContestantsPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
  const { data: contestants } = await supabase
    .from('contestants')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Contestants</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form action={createContestant} encType="multipart/form-data" className="card h-fit space-y-4 p-5">
          <h2 className="font-semibold text-neutral-900">Add Contestant</h2>
          <div>
            <label className="label">Category</label>
            <select name="category_id" required className="input">
              {((categories as Category[]) || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Contestant Name</label>
            <input name="name" required className="input" placeholder="John Doe" />
          </div>
          <div>
            <label className="label">Contestant Number</label>
            <input name="contestant_number" required className="input" placeholder="#001" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input" rows={2} />
          </div>
          <div>
            <label className="label">Photo</label>
            <input name="image" type="file" accept="image/*" className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Add Contestant
          </button>
        </form>

        <div className="card divide-y divide-neutral-100 p-5">
          {((contestants as any[]) || []).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {c.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {c.contestant_number} &middot; {c.name}
                  </p>
                  <p className="text-xs text-neutral-500">{c.categories?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {c.status}
                </span>
                <form action={toggleContestantStatus.bind(null, c.id, c.status)}>
                  <button className="text-xs font-semibold text-brand-700 hover:underline">
                    {c.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </form>
                <form action={deleteContestant.bind(null, c.id)}>
                  <button className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                </form>
              </div>
            </div>
          ))}
          {(!contestants || contestants.length === 0) && (
            <p className="py-6 text-center text-neutral-500">No contestants yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
