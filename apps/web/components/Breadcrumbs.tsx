import Link from 'next/link';

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs text-[#4A4A4A]" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-[#888888]">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#52B788]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#1A1A1A]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
