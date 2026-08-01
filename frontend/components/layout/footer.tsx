import Link from 'next/link';
import { getCategories } from '@/lib/taxonomy';
import { NewsletterForm } from '@/components/newsletter-form';

export async function Footer() {
  const categories = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="focus-ring font-display text-xl font-bold tracking-tight">
            Digital<span className="text-primary">Gyaan</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Tech guides, Android app reviews, gadget reviews, and digital updates for Indian users.
          </p>
          <div className="mt-5 max-w-sm">
            <p className="mb-2 text-sm font-medium">Get the newsletter</p>
            <NewsletterForm />
          </div>
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wide">
            Categories
          </p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {categories.map((cat) => (
              <li key={cat._id}>
                <Link href={`/category/${cat.slug}`} className="focus-ring hover:text-foreground">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wide">
            Company
          </p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/about-us" className="focus-ring hover:text-foreground">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact-us" className="focus-ring hover:text-foreground">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="focus-ring hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="focus-ring hover:text-foreground">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5">
        <p className="container text-center text-xs text-muted-foreground">
          © {year} Digital Gyaan. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
