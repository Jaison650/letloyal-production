'use client';
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  // pill shape per design language; visible focus ring; 44px min touch target on md+
  'inline-flex items-center justify-center gap-2 rounded-full font-sans font-bold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-ring',
  {
    variants: {
      intent: {
        primary: 'bg-teal text-teal-fg hover:bg-teal-hover',
        reward: 'bg-reward text-reward-fg hover:brightness-95',
        secondary: 'bg-surface-1 text-ink border border-stroke-strong hover:bg-surface-2',
        ghost: 'text-teal hover:bg-teal-subtle',
        destructive: 'bg-bad-subtle text-bad hover:bg-bad hover:text-white',
      },
      size: {
        sm: 'h-9 px-4 text-body-sm',
        md: 'h-11 px-6 text-body',
        lg: 'h-12 px-8 text-body-lg',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, fullWidth, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ intent, size, fullWidth }), className)}
        aria-busy={loading || undefined}
        {...(!asChild ? { disabled: disabled || loading } : {})}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            )}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
