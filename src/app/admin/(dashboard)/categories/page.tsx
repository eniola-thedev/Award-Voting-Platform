import { createClient } from '@/lib/supabase/server';
import { createCategory, toggleCategoryStatus, deleteCategory } from '../../actions';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order');

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Categories</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form action={createCategory} className="card h-fit space-y-4 p-5">
          <h2 className="font-semibold text-neutral-900">Add Category</h2>
          <div>
            <label className="label">Category Name</label>
            <input name="name" required className="input" placeholder="Best Male Student" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input" rows={3} />
          </div>
          <button type="submit" className="btn-primary w-full">
            Add Category
          </button>
        </form>

        <div className="card divide-y divide-neutral-100 p-5">
          {((categories as Category[]) || []).map((cat) => (
            <div key={cat.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-semibold text-neutral-900">{cat.name}</p>
                {cat.description && <p className="text-sm text-neutral-500">{cat.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    cat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {cat.status}
                </span>
                <form action={toggleCategoryStatus.bind(null, cat.id, cat.status)}>
                  <button className="text-xs font-semibold text-brand-700 hover:underline">
                    {cat.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </form>
                <form action={deleteCategory.bind(null, cat.id)}>
                  <button className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                </form>
              </div>
            </div>
          ))}
          {(!categories || categories.length === 0) && (
            <p className="py-6 text-center text-neutral-500">No categories yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
