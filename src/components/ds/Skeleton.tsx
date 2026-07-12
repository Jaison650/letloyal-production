import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const skeletonVariants = cva('animate-pulse bg-surface-2', {
  variants: {
    shape: {
      text: 'h-4 rounded-md',
      rect: 'rounded-[11px]',
      circle: 'rounded-full',
    },
  },
  defaultVariants: { shape: 'text' },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return <div aria-hidden className={cn(skeletonVariants({ shape }), className)} {...props} />;
}
