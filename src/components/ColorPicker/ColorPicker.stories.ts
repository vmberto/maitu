import type { Meta, StoryObj } from '@storybook/react';

import { ColorPicker } from '@/src/components/ColorPicker/ColorPicker';

const meta = {
  title: 'ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    color: 'primary',
    setColor: () => {},
  },
};
