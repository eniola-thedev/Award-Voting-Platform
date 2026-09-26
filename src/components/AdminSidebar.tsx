'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminSignOut } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/codes', label: 'Voting Codes' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/contestants', label: 'Contestants' },
  { href: '/admin/votes', label: 'Votes' },
  { href: '/admin/results', label: 'Results' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-neutral-200 bg-brand-800 p-4 text-white md:h-screen md:w-56 md:border-b-0 md:border-r">
      <p className="mb-6 px-2 font-display text-base font-bold">NAQSS Admin</p>
      <nav className="flex flex-wrap gap-1 md:flex-col">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                active ? 'bg-white text-brand-800' : 'text-brand-100 hover:bg-brand-700'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action={adminSignOut} className="mt-4 md:mt-6">
        <button type="submit" className="text-sm font-medium text-brand-200 hover:text-white">
          Sign Out
        </button>
      </form>
    </aside>
  );
}
