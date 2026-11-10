'use client';

import cx from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Debates', matches: (path: string) => path === '/' || path.startsWith('/debate/') },
  { href: '/explore', label: 'Explore', matches: (path: string) => path.startsWith('/explore') },
];

/** The bar above every page. */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="border-b border-divider bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2 text-sm">
        {LINKS.map(link => {
          const current = link.matches(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current ? 'page' : undefined}
              className={cx(
                'rounded-full px-3 py-1.5',
                current ? 'bg-text text-white' : 'text-grey-04 hover:text-text'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
