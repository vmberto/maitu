import { fireEvent, render, screen } from '@testing-library/react';

import { ColorPicker, Colors } from './ColorPicker';

describe('ColorPicker Component', () => {
  let setColorMock: jest.Mock;

  beforeEach(() => {
    setColorMock = jest.fn();
  });

  test('renders color picker with all color options', () => {
    render(<ColorPicker setColor={setColorMock} />);

    // Assert that all color options are rendered
    Object.values(Colors).forEach((color) => {
      const button = screen.getByLabelText(color);
      expect(button).toBeInTheDocument();
    });
  });

  test('sets the correct border color when a color is selected', () => {
    render(<ColorPicker color={Colors.RED_COLOR} setColor={setColorMock} />);

    const selectedButton = screen.getByLabelText(Colors.RED_COLOR);
    expect(selectedButton).toHaveClass('border-gray-900');

    // Assert that other colors do not have the selected border color
    Object.values(Colors)
      .filter((c) => c !== Colors.RED_COLOR)
      .forEach((color) => {
        const button = screen.getByLabelText(color);
        expect(button).not.toHaveClass('border-gray-900');
      });
  });

  test('calls setColor when a color is clicked', () => {
    render(<ColorPicker setColor={setColorMock} />);

    const button = screen.getByLabelText(Colors.GREEN_COLOR);
    fireEvent.click(button);

    expect(setColorMock).toHaveBeenCalledTimes(1);
    expect(setColorMock).toHaveBeenCalledWith(Colors.GREEN_COLOR);
  });
});
