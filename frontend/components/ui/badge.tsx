import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'live' | 'outline';

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide',
        variant === 'default' && 'bg-primary/15 text-primary',
        variant === 'live' && 'bg-live/15 text-live',
        variant === 'outline' && 'border border-border text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}
