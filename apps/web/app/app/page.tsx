import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Get the app',
  description:
    'Download the HomeBase app for iOS and Android. Search homes, schedule tours, and manage offers on the go.',
  openGraph: {
    title: 'Get the HomeBase app',
    description:
      'Download the HomeBase app for iOS and Android. Search homes, schedule tours, and manage offers on the go.',
  },
};

export default function AppPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 text-4xl">
          📱
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-50">
          Get the HomeBase app
        </h1>
        <p className="mt-3 max-w-md text-slate-300">
          Search homes, save favorites, schedule tours, and submit offers — all from your phone.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="https://apps.apple.com/app/homebase-real-estate/id1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-4 text-slate-100 hover:border-emerald-500/50 hover:bg-slate-800/80"
          >
            <span className="text-3xl">🍎</span>
            <div className="text-left">
              <div className="text-[10px] text-slate-500">Download on the</div>
              <div className="text-lg font-semibold">App Store</div>
            </div>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.homebase.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-4 text-slate-100 hover:border-emerald-500/50 hover:bg-slate-800/80"
          >
            <span className="text-3xl">▶</span>
            <div className="text-left">
              <div className="text-[10px] text-slate-500">Get it on</div>
              <div className="text-lg font-semibold">Google Play</div>
            </div>
          </a>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Coming soon. In the meantime, use HomeBase on the web for the full experience.
        </p>
        <Link
          href="/properties"
          className="mt-6 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Browse homes on web →
        </Link>
      </main>
    </div>
  );
}
