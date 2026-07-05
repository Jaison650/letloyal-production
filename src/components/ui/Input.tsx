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
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && revealed ? 'text' : type}
            className={clsx(
              'form-input',
              icon && 'pl-11',
              isPassword && 'pr-11',
              error && 'border-status-error focus:border-status-error focus:shadow-[0_0_0_4px_rgba(211,47,47,0.1)]',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setRevealed(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-medium"
              aria-label={revealed ? 'Hide password' : 'Show password'}
            >
              {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-status-error font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-light">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
