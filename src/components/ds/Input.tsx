'use client';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const fieldVariants = cva(
  'w-full rounded-[11px] border-[1.5px] bg-surface-1 font-sans text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:border-teal focus:shadow-ring disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-body-sm',
        md: 'px-3.5 py-2.5 text-[16px] md:text-body', // 16px on mobile prevents iOS zoom
      },
      invalid: {
        true: 'border-bad focus:border-bad',
        false: 'border-stroke-strong',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof fieldVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldVariants({ size, invalid }), className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';
