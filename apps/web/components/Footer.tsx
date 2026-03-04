import Link from 'next/link';

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-secondary)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-brand-primary)]">
              <HouseIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold text-[var(--color-brand-primary)]">
              HomeBase
            </span>
          </Link>
          <p className="mt-3 font-body text-sm text-[var(--color-text-muted)]">
            The smarter way home.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">
              Buy
            </h3>
            <ul className="space-y-2 font-body text-sm">
              <li><Link href="/properties" className="hover:text-[var(--color-text-primary)]">Browse homes</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[var(--color-text-primary)]">How it works</Link></li>
              <li><Link href="/preapproval" className="hover:text-[var(--color-text-primary)]">Pre-approval</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[var(--color-text-primary)]">Buyer guide</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">
              Sell
            </h3>
            <ul className="space-y-2 font-body text-sm">
              <li><Link href="/sell/list" className="hover:text-[var(--color-text-primary)]">List your home</Link></li>
              <li><Link href="/sell/dashboard" className="hover:text-[var(--color-text-primary)]">Seller dashboard</Link></li>
              <li><Link href="/sell" className="hover:text-[var(--color-text-primary)]">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">
              Company
            </h3>
            <ul className="space-y-2 font-body text-sm">
              <li><Link href="#" className="hover:text-[var(--color-text-primary)]">About</Link></li>
              <li><Link href="#" className="hover:text-[var(--color-text-primary)]">Blog</Link></li>
              <li><Link href="#" className="hover:text-[var(--color-text-primary)]">Careers</Link></li>
              <li><Link href="#" className="hover:text-[var(--color-text-primary)]">Contact</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-body text-xs text-[var(--color-text-muted)]">
            © {year} HomeBase. No agents were harmed in the making of this platform.
          </span>
          <div className="flex gap-4">
            <Link href="#" className="font-body text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
              Legal
            </Link>
            <Link href="#" className="font-body text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
