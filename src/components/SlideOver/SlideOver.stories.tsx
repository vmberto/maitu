import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from '@/src/components/Typography/Typography';

import { SlideOver } from './SlideOver';

const meta: Meta<typeof SlideOver> = {
  title: 'SlideOver',
  component: SlideOver,
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the SlideOver',
    },
    open: {
      control: 'boolean',
      description: 'Controls whether the SlideOver is open or closed',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback function when the SlideOver is closed',
    },
    children: {
      control: 'text',
      description: 'Content inside the SlideOver',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SlideOver>;

export const Default: Story = {
  args: {
    title: 'SlideOver Title',
    open: true,
    children: 'This is the content inside the SlideOver.',
  },
};

export const WithCustomContent: Story = {
  args: {
    title: 'Custom SlideOver',
    open: true,
    children: (
      <div>
        <Typography as="p">
          This is custom content inside the SlideOver.
        </Typography>
      </div>
    ),
  },
};
