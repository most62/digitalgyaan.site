'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const ALLOWED_ROLES = ['admin', 'editor', 'author'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoading || isLoginPage) return;
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      router.replace('/admin/login');
    }
  }, [user, isLoading, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-muted/40">{children}</div>;
  }

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="border-b border-border bg-surface">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-lg font-bold">
              Digital Gyaan Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                Posts
              </Link>
              <Link href="/admin/posts/new" className="text-muted-foreground hover:text-foreground">
                New Post
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {user.name} · {user.role}
            </span>
            <button
              onClick={async () => {
                await logout();
                router.push('/admin/login');
              }}
              className="focus-ring rounded-md border border-border px-3 py-1.5 hover:bg-accent"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
      <div className="container py-8">{children}</div>
    </div>
  );
}
