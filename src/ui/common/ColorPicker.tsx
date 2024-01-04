import React, { type FC } from 'react';
import { BackgroundColors, BorderColors } from 'src/lib/colors';

export const Colors = [
  'primary',
  'palette_one',
  'palette_two',
  'palette_three',
  'palette_four',
];

interface ColorPickerProps {
  color: string;
  setColor: (color: string) => void;
}

export const ColorPicker: FC<ColorPickerProps> = ({ color, setColor }) => {
  const changeColor = (newColor: string) => () => {
    setColor(newColor);
  };

  return (
    <div>
      <span className="mb-2 block font-light text-gray-700">
        Select List Color
      </span>
      <div className="flex gap-5">
        {Colors.map((c) => (
          <button
            type="button"
            aria-label={c}
            key={c}
            onClick={changeColor(c)}
            className={`${color === c ? 'border-gray-900' : BorderColors.get(c)}
        relative cursor-pointer border-4 transition-all ${BackgroundColors.get(
          c,
        )} items-center rounded-full p-4`}
          />
        ))}
      </div>
    </div>
  );
};
