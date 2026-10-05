import { type InputHTMLAttributes, type ReactElement, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | ReactElement;
}

export const Input = ({
  label,
  value,
  onChange,
  name,
  ...rest
}: InputProps) => {
  const generatedId = useId();
  const inputId = rest.id ?? name ?? generatedId;
  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
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
      bg-surface bg-clip-padding px-3 py-1.5
      text-base font-normal text-gray-700 transition
      ease-in-out focus:border-blue-600 focus:bg-surface
      focus:text-gray-700 focus:outline-none"
        defaultValue={value}
        onChange={onChange}
        id={inputId}
      />
    </div>
  );
};
