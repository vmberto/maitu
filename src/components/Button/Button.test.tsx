import { fireEvent, render, screen } from '@testing-library/react';

import { Button } from './Button';

describe('Button Component', () => {
  test('renders with children', () => {
    render(<Button color="blue">Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('renders with label when children are not provided', () => {
    render(<Button color="blue" label="Submit" />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('button is disabled when loading', () => {
    render(<Button color="blue" loading />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50 cursor-not-allowed');
  });

  test('shows loading spinner and text when loading is true', () => {
    render(<Button color="blue" loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('fires click event when clicked and not loading', () => {
    const handleClick = jest.fn();
    render(
      <Button color="blue" onClick={handleClick}>
        Click Me
      </Button>,
    );
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not fire click event when loading', () => {
    const handleClick = jest.fn();
    render(
      <Button color="blue" onClick={handleClick} loading>
        Click Me
      </Button>,
    );
    fireEvent.click(screen.getByText('Loading...'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('applies the correct background color', () => {
    render(<Button color="green">Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-green');
  });

  test('button defaults to type "button"', () => {
    render(<Button color="blue">Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  test('button can have type "submit"', () => {
    render(
      <Button color="blue" type="submit">
        Submit
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('focus styles are applied when button is focused', () => {
    render(<Button color="blue">Click Me</Button>);
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    expect(button).toHaveClass('focus:bg-blue-700 focus:shadow-lg');
  });

  test('active styles are applied when button is active', () => {
    render(<Button color="blue">Click Me</Button>);
    const button = screen.getByRole('button');
    fireEvent.mouseDown(button);
    expect(button).toHaveClass('active:bg-blue-800 active:shadow-lg');
  });
});
