import React, { FC } from 'react';

export enum Colors {
  PRIMARY = 'primary',
  PALETTE_ONE = 'palette_one',
  PALETTE_TWO = 'palette_two',
  PALETTE_THREE = 'palette_three',
  PALETTE_FOUR = 'palette_four'
}
interface ColorPickerProps {
  color: Colors;
  setColor: (color: Colors) => void;
}

export const ColorPicker: FC<ColorPickerProps> = ({ color, setColor }) => {
  const changeColor = (newColor: Colors) => () => {
    setColor(newColor);
  };

  return (
    <div>
      <label className="block mb-2 font-light text-gray-700">Select List Color</label>
      <div className="flex gap-5">
        <div
          onClick={changeColor(Colors.PALETTE_ONE)}
          className={`${color === Colors.PALETTE_ONE ? 'border-gray-900' : ''}
        relative cursor-pointer transition-all border-palette_one border-4 bg-palette_one p-4 rounded-full items-center`}></div>
        <div
          onClick={changeColor(Colors.PALETTE_TWO)}
          className={`${color === Colors.PALETTE_TWO ? 'border-gray-900' : ''}
        cursor-pointer transition-all border-palette_two border-4 bg-palette_two p-4 rounded-full items-center`}></div>
        <div
          onClick={changeColor(Colors.PRIMARY)}
          className={`${color === Colors.PRIMARY ? 'border-gray-900' : ''}
        cursor-pointer transition-all border-primary border-4 bg-primary p-4 rounded-full items-center`}></div>
        <div
          onClick={changeColor(Colors.PALETTE_THREE)}
          className={`${color === Colors.PALETTE_THREE ? 'border-gray-900' : ''}
        cursor-pointer transition-all border-palette_three border-4 bg-palette_three p-4 rounded-full items-center`}></div>
        <div
          onClick={changeColor(Colors.PALETTE_FOUR)}
          className={`${color === Colors.PALETTE_FOUR ? 'border-gray-900' : ''}
        cursor-pointer transition-all border-palette_four border-4 bg-palette_four p-4 rounded-full items-center`}></div>
      </div>
    </div>
  );
};
