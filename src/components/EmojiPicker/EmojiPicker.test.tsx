import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmojiPickerComponent } from './EmojiPicker';

it('marks the current choice and selects another native emoji', async () => {
  const select = jest.fn();
  render(<EmojiPickerComponent emoji="😊" setEmoji={select} />);
  expect(screen.getByRole('button', { name: 'Happy' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await userEvent.click(screen.getByRole('button', { name: 'earth africa' }));
  expect(select).toHaveBeenCalledWith('🌍');
});
it('filters a small local emoji bank and accepts a pasted symbol', async () => {
  const select = jest.fn();
  render(<EmojiPickerComponent emoji="" setEmoji={select} />);
  await userEvent.type(
    screen.getByRole('searchbox', { name: 'Search emojis' }),
    'work',
  );
  expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Home' }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('textbox', { name: 'Custom emoji' }));
  await userEvent.paste('🦊');
  expect(select).toHaveBeenCalledWith('🦊');
});
