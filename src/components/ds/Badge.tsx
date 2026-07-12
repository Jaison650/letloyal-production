import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold',
  {
    variants: {
      intent: {
        neutral: 'bg-surface-2 text-ink-sub',
        success: 'bg-good-subtle text-good',
        warning: 'bg-warn-subtle text-warn',
        error: 'bg-bad-subtle text-bad',
        teal: 'bg-teal-subtle text-teal',
        reward: 'bg-reward-subtle text-reward-deep',
      },
    },
    defaultVariants: { intent: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, intent, dot, children, ...props }: BadgeProps) {
  const showDot = dot ?? true;
  return (
    <span className={cn(badgeVariants({ intent }), className)} {...props}>
      {showDot && <i aria-hidden className="h-1 w-1 rounded-full bg-current" />}
      {children}
    </span>
  );
}
