import { FC, InputHTMLAttributes, ReactElement } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactElement;
}

export const Input: FC<InputProps> = ({ label, value, onChange }) => (
  <div className="form-group mb-4">
    <label htmlFor="firstName" className="form-label inline-block mb-2 font-light text-gray-700">
      {label}
    </label>
    <input
      type="text"
      className="form-control block w-full px-3
      py-1.5 text-base font-normal text-gray-700
      bg-white bg-clip-padding border border-solid
      border-gray-300 rounded transition ease-in-out
      m-0 focus:text-gray-700 focus:bg-white
      focus:border-blue-600 focus:outline-none"
      value={value}
      onChange={onChange}
      id="firstName"
    />
  </div>
);
