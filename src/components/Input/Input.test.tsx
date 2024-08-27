import { fireEvent, render, screen } from '@testing-library/react';

import { Input } from './Input';

describe('Input Component', () => {
  test('renders without crashing', () => {
    render(<Input name="test-input" />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeInTheDocument();
  });

  test('renders with a label', () => {
    render(<Input name="test-input" label="Test Label" />);
    const labelElement = screen.getByText('Test Label');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveAttribute('for', 'test-input');
  });

  test('renders with a React element as label', () => {
    const customLabel = <span>Custom Label</span>;
    render(<Input name="test-input" label={customLabel} />);
    const labelElement = screen.getByText('Custom Label');
    expect(labelElement).toBeInTheDocument();
  });

  test('passes value prop correctly', () => {
    const handleChange = jest.fn();
    render(
      <Input name="test-input" value="test value" onChange={handleChange} />,
    );
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveValue('test value');
  });

  test('calls onChange handler when input value changes', () => {
    const handleChange = jest.fn();
    render(<Input name="test-input" value="" onChange={handleChange} />);
    const inputElement = screen.getByRole('textbox');

    fireEvent.change(inputElement, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('applies additional props to input, including placeholder and disabled', () => {
    const handleChange = jest.fn();
    render(
      <Input
        name="test-input"
        placeholder="Enter text"
        disabled
        onChange={handleChange}
      />,
    );
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveAttribute('placeholder', 'Enter text');
    expect(inputElement).toBeDisabled();
  });

  test('focus styles are applied when input is focused', () => {
    const handleChange = jest.fn();
    render(<Input name="test-input" onChange={handleChange} />);
    const inputElement = screen.getByRole('textbox');
    fireEvent.focus(inputElement);
    expect(inputElement).toHaveClass(
      'focus:border-blue-600 focus:bg-white focus:text-gray-700 focus:outline-none',
    );
  });
});
