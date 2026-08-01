'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FaqEntry } from '@/types/post';

export function FaqSection({ faqs }: { faqs: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <section className="mt-12 border-t border-border pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-border rounded-xl border border-border">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
              className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
            >
              {faq.question}
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform', openIndex === i && 'rotate-180')}
              />
            </button>
            {openIndex === i && (
              <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
