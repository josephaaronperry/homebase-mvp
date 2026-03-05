import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sell your home | HomeBase',
  description: 'List your home on HomeBase. FSBO or list as an agent. Both paths are free during our launch period.',
};

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">
          ← HomeBase
        </Link>

        <div className="mt-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#52B788]">
            Sell with HomeBase
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[#1A1A1A] sm:text-5xl">
            How are you selling today?
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#4A4A4A]">
            Both paths are free during our launch period.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <Link
            href="/sell/list?type=fsbo"
            className="flex flex-col rounded-2xl border-2 border-[#E8E6E1] bg-white p-8 text-left shadow-sm transition hover:border-[#1B4332] hover:shadow-md"
          >
            <span className="text-4xl">🏡</span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A]">
              I&apos;m selling myself (FSBO)
            </h2>
            <p className="mt-2 text-sm text-[#4A4A4A]">
              List your home directly. No agent needed. Keep 100% of the savings.
            </p>
            <span className="mt-4 text-sm font-semibold text-[#52B788]">Start listing →</span>
          </Link>

          <Link
            href="/sell/list?type=agent"
            className="flex flex-col rounded-2xl border-2 border-[#E8E6E1] bg-white p-8 text-left shadow-sm transition hover:border-[#1B4332] hover:shadow-md"
          >
            <span className="text-4xl">🏢</span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A]">
              I&apos;m a licensed agent
            </h2>
            <p className="mt-2 text-sm text-[#4A4A4A]">
              List on behalf of your client. Enter your license details to get started.
            </p>
            <span className="mt-4 text-sm font-semibold text-[#52B788]">Start listing →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
