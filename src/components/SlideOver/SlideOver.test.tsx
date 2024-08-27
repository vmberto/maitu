/* eslint-disable class-methods-use-this */
import { fireEvent, render, screen } from '@testing-library/react';

import { useSwipeEvents } from '@/src/hooks/useSwipeEvents';
import { useSlideOver } from '@/src/providers/slideover.provider';

import { SlideOver } from './SlideOver';

class ResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

jest.mock('../../providers/slideover.provider');
jest.mock('../../hooks/useSwipeEvents');

describe('SlideOver Component', () => {
  const mockOnClose = jest.fn();
  const mockHandleClearSlideOverData = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Type the mocked useSlideOver hook correctly
    (useSlideOver as jest.Mock).mockReturnValue({
      handleClearSlideOverData: mockHandleClearSlideOverData,
    });

    // Type the mocked useSwipeEvents hook correctly
    (useSwipeEvents as jest.Mock).mockReturnValue({});
  });

  test('renders without crashing', () => {
    render(
      <SlideOver title="Test Title" open onClose={mockOnClose}>
        <p>Test Content</p>
      </SlideOver>,
    );
    const titleElement = screen.getByText('Test Title');
    const contentElement = screen.getByText('Test Content');
    expect(titleElement).toBeInTheDocument();
    expect(contentElement).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <SlideOver title="Test Title" open onClose={mockOnClose}>
        <p>Test Content</p>
      </SlideOver>,
    );
    const closeButton = screen.getByRole('button', { name: /close panel/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not render when open is false', () => {
    render(
      <SlideOver title="Test Title" open={false} onClose={mockOnClose}>
        <p>Test Content</p>
      </SlideOver>,
    );

    const titleElement = screen.queryByText('Test Title');
    const contentElement = screen.queryByText('Test Content');

    expect(titleElement).not.toBeInTheDocument();
    expect(contentElement).not.toBeInTheDocument();
  });
});
