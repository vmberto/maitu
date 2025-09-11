import { Meta, StoryObj } from '@storybook/react';

import { Typography } from '@/src/components/Typography/Typography';

const meta = {
  title: 'Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    as: { control: 'select' },
  },
  args: {},
} as Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Header1: Story = {
  args: {
    as: 'h1',
    children: 'Typography H1',
  },
};

export const Header2: Story = {
  args: {
    as: 'h2',
    children: 'Typography H2',
  },
};

export const Header3: Story = {
  args: {
    as: 'h3',
    children: 'Typography H3',
  },
};

export const Header4: Story = {
  args: {
    as: 'h4',
    children: 'Typography H4',
  },
};

export const Paragraph: Story = {
  args: {
    as: 'p',
    children: 'Paragraph',
  },
};
