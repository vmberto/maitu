import React, { FC } from 'react';

export const Colors = [
    'primary',
    'palette_one',
    'palette_two',
    'palette_three',
    'palette_four',
];

const Backgrounds = Map<string, string>([
   [ 'primary', 'bg-primary'],
    ['palette_one', 'bg-palette_one'],
    ['palette_two', 'bg-palette_two'],
    ['palette_three', 'bg-palette_three'],
   [ 'palette_four', 'bg-palette_four'],
 ]);

const Borders = Map<string, string>([
    [ 'primary', 'border-primary'],
    ['palette_one', 'border-palette_one'],
    ['palette_two', 'border-palette_two'],
    ['palette_three', 'border-palette_three'],
    [ 'palette_four', 'border-palette_four'],
]);

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
      <label className="block mb-2 font-light text-gray-700">Select List Color</label>
      <div className="flex gap-5">
        {Colors.map(c => <div
              onClick={changeColor(c)}
              className={`${color === c ? 'border-gray-900' : Borders.get(c)}
        relative cursor-pointer transition-all border-4 ${Backgrounds.get(c)} p-4 rounded-full items-center`}></div>)}
      </div>
    </div>
    );
};
