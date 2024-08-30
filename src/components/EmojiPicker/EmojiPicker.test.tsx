import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { EmojiPickerComponent } from './EmojiPicker';

describe('EmojiPickerComponent', () => {
  const mockSetEmoji = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component and displays the selected emoji', () => {
    render(<EmojiPickerComponent emoji="😊" setEmoji={mockSetEmoji} />);

    expect(screen.getByText('List Emoji')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
  });

  test('calls setEmoji with an empty string when the emoji button is clicked', async () => {
    render(<EmojiPickerComponent emoji="😊" setEmoji={mockSetEmoji} />);

    await userEvent.click(screen.getByText('😊'));

    expect(mockSetEmoji).toHaveBeenCalledWith('');
  });

  test('renders the EmojiPicker when no emoji is selected', () => {
    render(<EmojiPickerComponent emoji="" setEmoji={mockSetEmoji} />);

    expect(screen.queryByText('😊')).not.toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /travel & places/i }),
    ).toBeInTheDocument();
  });
});
