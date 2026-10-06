import { ArrowPathIcon } from '@heroicons/react/24/outline';
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  color?: string;
  loading?: boolean;
};
const tones: Record<string, string> = {
  primary: 'rubber-primary',
  blue: 'rubber-primary',
  danger: 'rubber-danger',
  green: 'rubber-success',
};

export function Button({
  color = 'primary',
  children,
  label,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`rubber-button ${tones[color] ?? ''} px-6 py-2.5 text-sm font-medium ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <ArrowPathIcon
            aria-hidden="true"
            className="size-5 animate-spin motion-reduce:animate-none"
          />
          Loading...
        </span>
      ) : (
        (children ?? label)
      )}
    </button>
  );
}
