import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva('rounded-[16px] border border-stroke bg-surface-1 shadow-ds', {
  variants: {
    padding: { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' },
    interactive: {
      true: 'transition-shadow hover:shadow-lg cursor-pointer',
    },
  },
  defaultVariants: { padding: 'md' },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, padding, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ padding, interactive }), className)} {...props} />;
}
