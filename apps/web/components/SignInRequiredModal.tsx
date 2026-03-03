'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

type Props = {
  onClose: () => void;
  action: 'schedule a tour' | 'make an offer';
};

export function SignInRequiredModal({ onClose, action }: Props) {
  const pathname = usePathname();
  const redirect = pathname ? encodeURIComponent(pathname) : '';
  const loginHref = redirect ? `/login?redirect=${redirect}` : '/login';
  const registerHref = redirect ? `/register?redirect=${redirect}` : '/register';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-2xl">
            🔐
          </div>
        </div>
        <h2 className="text-center text-lg font-semibold text-slate-50">
          Sign in to {action}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          It only takes 30 seconds. Then you can continue right where you left off.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={loginHref}
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Sign in
          </Link>
          <Link
            href={registerHref}
            onClick={onClose}
            className="w-full rounded-xl border border-slate-600 py-2.5 text-center text-sm font-semibold text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800"
          >
            Create account
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
