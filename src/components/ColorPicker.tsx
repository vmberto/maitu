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
    <div className="flex gap-5">
      <div
        onClick={changeColor(Colors.PALETTE_ONE)}
        className={`${color === Colors.PALETTE_ONE ? 'shadow-lg' : ''}
        relative cursor-pointer transition-all border-palette_one border bg-palette_one p-4 rounded-full items-center`}></div>
      <div
        onClick={changeColor(Colors.PALETTE_TWO)}
        className={`${color === Colors.PALETTE_TWO ? 'shadow-lg' : ''}
        cursor-pointer transition-all border-palette_two border bg-palette_two p-4 rounded-full items-center`}></div>
      <div
        onClick={changeColor(Colors.PRIMARY)}
        className={`${color === Colors.PRIMARY ? 'shadow-lg' : ''}
        cursor-pointer transition-all border-primary border bg-primary p-4 rounded-full items-center`}></div>
      <div
        onClick={changeColor(Colors.PALETTE_THREE)}
        className={`${color === Colors.PALETTE_THREE ? 'shadow-lg' : ''}
        cursor-pointer transition-all border-palette_three border bg-palette_three p-4 rounded-full items-center`}></div>
      <div
        onClick={changeColor(Colors.PALETTE_FOUR)}
        className={`${color === Colors.PALETTE_FOUR ? 'shadow-lg' : ''}
        cursor-pointer transition-all border-palette_four border bg-palette_four p-4 rounded-full items-center`}></div>
    </div>
  );
};
