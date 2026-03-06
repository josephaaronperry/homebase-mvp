'use client';

import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const baseClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-shadow duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
const variantClass: Record<Variant, string> = {
  primary: 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]',
  secondary: 'border-2 border-[#1B4332] bg-transparent text-[#1B4332] hover:bg-[#1B4332]/5',
  ghost: 'bg-transparent text-[#1B4332] hover:underline',
  danger: 'border-2 border-red-200 bg-transparent text-red-600 hover:bg-red-50',
};

type Props = {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  href?: string;
};

const motionProps = {
  primary: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } },
  secondary: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } },
  ghost: {},
  danger: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } },
};

export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  href,
}: Props) {
  const noMotion = disabled || loading;
  const motionVariant = motionProps[variant];
  const classes = `${baseClass} ${variantClass[variant]} ${className}`.trim();

  const content = loading ? (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
  ) : (
    children
  );

  if (href && !disabled && !loading) {
    return (
      <motion.a
        href={href}
        className={classes}
        {...(noMotion ? {} : motionVariant)}
        transition={{ duration: 0.15 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...(noMotion ? {} : motionVariant)}
      transition={{ duration: 0.15 }}
    >
      {content}
    </motion.button>
  );
}
