import { cn } from '@/lib/cn';

type Density = 'comfortable' | 'compact';
const cellPad: Record<Density, string> = {
  comfortable: 'px-3.5 py-3',
  compact: 'px-3 py-2',
};

export function Table({
  density = 'comfortable',
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { density?: Density }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        data-density={density}
        className={cn('w-full border-collapse text-body-sm [font-variant-numeric:tabular-nums]', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-surface-2', className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-3.5 py-2 text-left text-label uppercase text-ink-faint first:rounded-l-lg last:rounded-r-lg',
        className
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-stroke last:border-b-0', className)} {...props} />;
}

export function TD({
  density = 'comfortable',
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { density?: Density }) {
  return <td className={cn(cellPad[density], 'text-ink-sub', className)} {...props} />;
}
