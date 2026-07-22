import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const [revealed, setRevealed] = useState(false);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-body-sm font-semibold text-ink mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && revealed ? 'text' : type}
            className={clsx(
              'w-full rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 text-ink placeholder:text-ink-faint px-4 py-3 transition-colors focus:outline-none focus:border-teal focus:shadow-ring',
              icon && 'pl-11',
              isPassword && 'pr-11',
              error && 'border-bad focus:border-bad',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setRevealed(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-sub"
              aria-label={revealed ? 'Hide password' : 'Show password'}
            >
              {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-bad font-semibold">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
