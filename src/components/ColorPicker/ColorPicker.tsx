import React from 'react';

import { BackgroundColors, BorderColors } from '@/src/lib/colors';

export enum Colors {
  PRIMARY = 'primary',
  RED_COLOR = 'redColor',
  GREEN_COLOR = 'greenColor',
  PINK_COLOR = 'pinkColor',
  YELLOW_COLOR = 'yellowColor',
}

type ColorPickerProps = {
  color?: Colors;
  setColor: (color: Colors) => void;
};

export const ColorPicker = ({ color, setColor }: ColorPickerProps) => {
  const changeColor = (newColor: Colors) => () => {
    setColor(newColor);
  };

  return (
    <div>
      <span className="mb-2 block font-light text-gray-700">
        Select List Color
      </span>
      <div className="flex gap-5">
        {Object.values(Colors).map((c) => (
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
