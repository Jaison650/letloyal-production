'use client';
import { forwardRef } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { fieldVariants } from './Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Pick<VariantProps<typeof fieldVariants>, 'invalid'> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldVariants({ size: 'md', invalid }), 'min-h-[96px]', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
