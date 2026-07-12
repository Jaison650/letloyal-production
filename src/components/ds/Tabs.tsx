'use client';
import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: 'pill' | 'underline' }
>(({ className, variant = 'pill', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      variant === 'pill'
        ? 'inline-flex items-center gap-1 rounded-full bg-surface-2 p-1'
        : 'inline-flex items-center gap-5 border-b border-stroke',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { variant?: 'pill' | 'underline' }
>(({ className, variant = 'pill', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'text-body-sm font-bold text-ink-sub transition-colors focus-visible:outline-none focus-visible:shadow-ring',
      variant === 'pill'
        ? 'rounded-full px-4 py-1.5 data-[state=active]:bg-surface-1 data-[state=active]:text-ink data-[state=active]:shadow-sm'
        : '-mb-px border-b-2 border-transparent pb-2 data-[state=active]:border-teal data-[state=active]:text-ink',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = TabsPrimitive.Content;
