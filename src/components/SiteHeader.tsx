import Link from 'next/link';

export default function SiteHeader({ awardName }: { awardName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-brand-700">
          {awardName}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-neutral-600">
          <Link href="/categories" className="hidden hover:text-brand-700 sm:inline">
            Categories
          </Link>
          <Link href="/payment" className="hidden hover:text-brand-700 sm:inline">
            How to Pay
          </Link>
          <Link href="/vote" className="btn-primary !px-4 !py-2 text-sm">
            Vote Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
