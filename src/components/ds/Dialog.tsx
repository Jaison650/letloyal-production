'use client';
import { forwardRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const contentVariants = cva(
  'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-stroke bg-surface-1 p-6 shadow-ds focus-visible:outline-none',
  {
    variants: {
      size: { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' },
    },
    defaultVariants: { size: 'md' },
  }
);

export const DialogContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & VariantProps<typeof contentVariants>
>(({ className, size, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
    <DialogPrimitive.Content ref={ref} className={cn(contentVariants({ size }), className)} {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

export function DialogHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <DialogPrimitive.Title className="font-display text-h3 text-ink">{title}</DialogPrimitive.Title>
      {description && (
        <DialogPrimitive.Description className="mt-1 text-body-sm text-ink-sub">
          {description}
        </DialogPrimitive.Description>
      )}
    </div>
  );
}
