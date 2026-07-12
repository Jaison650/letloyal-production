import { cn } from '@/lib/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        // NOTE: bg-surface-2/50 was specified but does not work — Tailwind can't apply an
        // alpha modifier to a var()-based color (see report), so it silently drops to full
        // opacity. Using plain bg-surface-2 instead.
        'flex flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-stroke-strong bg-surface-2 px-6 py-12 text-center',
        className
      )}
      {...props}
    >
      {icon && <div className="mb-1 text-ink-faint">{icon}</div>}
      <p className="font-display text-h4 text-ink">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-ink-sub">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
