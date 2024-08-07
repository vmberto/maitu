import { type InputHTMLAttributes, type ReactElement } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | ReactElement;
}

export const Input = ({
  label,
  value,
  onChange,
  name,
  ...rest
}: InputProps) => (
  <div>
    {label && (
      <label
        htmlFor={name}
        className="mb-2 inline-block font-light text-gray-700"
      >
        {label}
      </label>
    )}
    <input
      {...rest}
      name={name}
      className="m-0 block w-full
      rounded border border-solid border-gray-300
      bg-white bg-clip-padding px-3 py-1.5
      text-base font-normal text-gray-700 transition
      ease-in-out focus:border-blue-600 focus:bg-white
      focus:text-gray-700 focus:outline-none"
      value={value}
      onChange={onChange}
      id={name}
    />
  </div>
);
