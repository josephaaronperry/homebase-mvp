'use client';

import { useState } from 'react';

const MIN_PRICE = 100_000;
const MAX_PRICE = 2_000_000;
const STEP = 25_000;
const FLAT_FEE = 4_000;
const COMMISSION_RATE = 0.06;

type SavingsCalculatorProps = {
  variant?: 'light' | 'dark';
};

export function SavingsCalculator({ variant = 'dark' }: SavingsCalculatorProps) {
  const [price, setPrice] = useState(500_000);
  const agentCost = Math.round(price * COMMISSION_RATE);
  const savings = Math.max(0, agentCost - FLAT_FEE);
  const fillPct = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  const isDark = variant === 'dark';

  return (
    <section
      className={
        isDark
          ? 'bg-[var(--color-bg-dark)] px-4 py-16 text-[var(--color-text-inverse)] sm:px-6 lg:px-8'
          : 'bg-warm-subtle px-4 py-12 sm:px-6 lg:px-8'
      }
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          {isDark ? "See what you'd save" : 'See your savings'}
        </h2>
        <p className="mt-2 font-body text-base text-[var(--color-text-muted)]">
          {isDark ? 'Move the slider to your home price.' : 'Move the slider to your home price. Compare traditional agent cost vs HomeBase.'}
        </p>

        <div className="relative mt-8">
          <label htmlFor="savings-price" className="sr-only">
            Home price
          </label>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/20">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-brand-primary)] transition-all duration-200"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <input
            id="savings-price"
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={STEP}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="absolute inset-0 h-3 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--color-brand-accent)] [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="mt-4 flex justify-between font-body text-sm text-[var(--color-text-muted)]">
            <span>${(MIN_PRICE / 1000).toFixed(0)}k</span>
            <span className="font-semibold text-[var(--color-text-inverse)]">
              ${(price / 1000).toFixed(0)}k
            </span>
            <span>${(MAX_PRICE / 1000).toFixed(0)}k</span>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div
            className={`rounded-[var(--radius-md)] border px-5 py-4 ${
              isDark
                ? 'border-red-500/30 bg-red-500/10'
                : 'border-[var(--color-border-strong)] bg-[var(--color-bg-card)]'
            }`}
          >
            <div className="font-body text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Traditional agent cost
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-red-600">
              ${agentCost.toLocaleString()}
            </div>
            <div className="font-body text-xs text-[var(--color-text-muted)]">6% of price</div>
          </div>
          <div
            className={`rounded-[var(--radius-md)] border px-5 py-4 ${
              isDark
                ? 'border-white/20 bg-white/5'
                : 'border-[var(--color-border)] bg-[var(--color-bg-card)]'
            }`}
          >
            <div className="font-body text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              HomeBase flat fee
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-[var(--color-text-primary)]">
              $4,000 flat
            </div>
            <div className="font-body text-xs text-[var(--color-text-muted)]">One flat fee</div>
          </div>
          <div className="rounded-[var(--radius-md)] border-2 border-[var(--color-brand-accent)] bg-[var(--color-brand-accent)]/20 px-5 py-5">
            <div className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-primary)]">
              You save
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-[var(--color-brand-primary)] sm:text-4xl">
              ${savings.toLocaleString()}
            </div>
            <p className={`mt-1 font-body text-sm ${isDark ? 'text-[var(--color-brand-primary-light)]' : 'text-[var(--color-text-secondary)]'}`}>
              back in your pocket
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
