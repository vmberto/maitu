import React, {FC} from 'react';
import {BackgroundColors, BorderColors} from 'src/lib/colors';

export const Colors = ['primary', 'palette_one', 'palette_two', 'palette_three', 'palette_four'];

interface ColorPickerProps {
    color: string;
    setColor: (color: string) => void;
}

export const ColorPicker: FC<ColorPickerProps> = ({color, setColor}) => {
    const changeColor = (newColor: string) => () => {
        setColor(newColor);
    };

    return (
        <div>
            <label className="block mb-2 font-light text-gray-700">Select List Color</label>
            <div className="flex gap-5">
                {Colors.map((c) => (
                    <div
                        key={c}
                        onClick={changeColor(c)}
                        className={`${color === c ? 'border-gray-900' : BorderColors.get(c)}
        relative cursor-pointer transition-all border-4 ${BackgroundColors.get(
                            c
                        )} p-4 rounded-full items-center`}></div>
                ))}
            </div>
        </div>
    );
};
