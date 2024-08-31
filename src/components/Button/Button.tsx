/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable tailwindcss/classnames-order */
/* eslint-disable react/button-has-type */
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // Import the RefreshIcon from Heroicons
import type { HTMLProps, ReactNode } from 'react';

type ButtonProps = HTMLProps<HTMLButtonElement> & {
  type?: 'button' | 'submit' | 'reset';
  color: string;
  children?: ReactNode;
  loading?: boolean;
};

export const Button = ({
  color,
  children,
  label,
  loading,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    type={props.type || 'button'}
    disabled={loading} // Disable button when loading
    className={
      `${props.className} px-6 py-2.5 bg-${color} text-white font-medium text-sm 
    leading-tight uppercase rounded shadow-md hover:bg-${color}-700 hover:shadow-lg
    focus:bg-${color}-700 focus:shadow-lg focus:outline-none focus:ring-0
    active:bg-${color}-800 active:shadow-lg transition duration-150
    ease-in-out
    ${loading ? 'opacity-50 cursor-not-allowed' : ''}` // Adjust styles for loading state
    }
  >
    {loading && (
      <div className="flex items-center justify-center">
        <ArrowPathIcon className="animate-spin size-5 mr-3" /> Loading...
      </div>
    )}

    {!loading && (children ?? label)}
  </button>
);
