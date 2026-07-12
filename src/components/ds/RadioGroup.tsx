'use client';
import { forwardRef } from 'react';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/cn';

export const RadioGroup = forwardRef<
  React.ComponentRef<typeof RadioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioPrimitive.Root ref={ref} className={cn('grid gap-2.5', className)} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = forwardRef<
  React.ComponentRef<typeof RadioPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioPrimitive.Item
    ref={ref}
    className={cn(
      'h-5 w-5 rounded-full border-[1.5px] border-stroke-strong bg-surface-1 transition-colors',
      'focus-visible:outline-none focus-visible:shadow-ring',
      'data-[state=checked]:border-teal',
      'disabled:opacity-50',
      className
    )}
    {...props}
  >
    <RadioPrimitive.Indicator className="flex items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-teal" />
    </RadioPrimitive.Indicator>
  </RadioPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';
