/* eslint-disable tailwindcss/no-custom-classname */
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { Typography } from './Typography';

describe('Typography Component', () => {
  test('renders an h1 element with correct class', () => {
    render(
      <Typography as="h1" className="custom-class">
        Heading 1
      </Typography>,
    );

    const element = screen.getByText('Heading 1');
    expect(element.tagName).toBe('H1');
    expect(element).toHaveClass('custom-class');
    expect(element).toHaveClass('font-semibold');
  });

  test('renders an h2 element with correct class', () => {
    render(
      <Typography as="h2" className="custom-class">
        Heading 2
      </Typography>,
    );

    const element = screen.getByText('Heading 2');
    expect(element.tagName).toBe('H2');
    expect(element).toHaveClass('custom-class');
  });

  test('renders an h3 element with correct class', () => {
    render(
      <Typography as="h3" className="custom-class">
        Heading 3
      </Typography>,
    );

    const element = screen.getByText('Heading 3');
    expect(element.tagName).toBe('H3');
    expect(element).toHaveClass('custom-class');
  });

  test('renders an h4 element with correct class', () => {
    render(
      <Typography as="h4" className="custom-class">
        Heading 4
      </Typography>,
    );

    const element = screen.getByText('Heading 4');
    expect(element.tagName).toBe('H4');
    expect(element).toHaveClass('custom-class');
  });

  test('renders a p element with correct class', () => {
    render(
      <Typography as="p" className="custom-class">
        Paragraph
      </Typography>,
    );

    const element = screen.getByText('Paragraph');
    expect(element.tagName).toBe('P');
    expect(element).toHaveClass('custom-class');
    expect(element).toHaveClass('text-sm');
  });

  test('forwards ref correctly', () => {
    const ref = createRef<HTMLElement>();

    render(
      <Typography as="h1" ref={ref}>
        Heading with Ref
      </Typography>,
    );

    expect(ref.current).toBeInTheDocument();
    expect(ref.current?.tagName).toBe('H1');
  });

  test('renders with additional props', () => {
    render(
      <Typography
        as="h2"
        className="custom-class"
        id="unique-id"
        data-testid="test-id"
      >
        Heading with Props
      </Typography>,
    );

    const element = screen.getByTestId('test-id');
    expect(element).toHaveAttribute('id', 'unique-id');
    expect(element).toHaveClass('custom-class');
  });
});
