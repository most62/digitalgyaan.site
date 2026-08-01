import Link from 'next/link';
import { Search } from 'lucide-react';
import { getCategories } from '@/lib/taxonomy';
import { ThemeToggle } from '@/components/theme-toggle';
import { TrendingTicker } from './trending-ticker';
import { MobileNav } from './mobile-nav';

export async function Header() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-50 bg-background">
      <TrendingTicker />
      <div className="container relative flex h-16 items-center justify-between">
        <Link href="/" className="focus-ring font-display text-xl font-bold tracking-tight">
          Digital<span className="text-primary">Gyaan</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              className="focus-ring text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
          >
            <Search className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          <MobileNav categories={categories} />
        </div>
      </div>
    </header>
  );
}
