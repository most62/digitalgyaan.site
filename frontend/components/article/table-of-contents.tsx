'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TocEntry } from '@/types/post';

export function TableOfContents({ toc }: { toc: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -70% 0px' }
    );

    toc.forEach((entry) => {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="sticky top-24 rounded-xl border border-border p-5">
      <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wide">
        On this page
      </p>
      <ul className="space-y-2 text-sm">
        {toc.map((entry) => (
          <li key={entry.id} style={{ paddingLeft: (entry.level - 2) * 12 }}>
            <a
              href={`#${entry.id}`}
              className={cn(
                'focus-ring block py-0.5 text-muted-foreground transition-colors hover:text-foreground',
                activeId === entry.id && 'font-medium text-primary'
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
