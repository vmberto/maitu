import type { ForwardedRef, ReactNode } from 'react';
import React, { forwardRef } from 'react';

type Props<T extends keyof JSX.IntrinsicElements> = React.ComponentProps<T>;

type BaseTypographyProps = Props<'p'> &
  Props<'h1'> &
  Props<'h2'> &
  Props<'h3'> &
  Props<'h4'>;
export type TypographyProps = BaseTypographyProps & {
  as: 'p' | 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
  children: ReactNode;
};

const TypographyComponent = (
  { as, className, children, ...rest }: TypographyProps,
  ref: ForwardedRef<HTMLElement>,
) => {
  let template;

  switch (as) {
    case 'h1':
      template = React.createElement(
        as,
        {
          ...rest,
          ref,
          className: `${className} font-semibold`,
        },
        children,
      );
      break;
    case 'h2':
      template = React.createElement(
        as,
        {
          ...rest,
          ref,
          className,
        },
        children,
      );
      break;
    case 'h3':
      template = React.createElement(
        as,
        {
          ...rest,
          ref,
          className,
        },
        children,
      );
      break;
    case 'h4':
      template = React.createElement(
        as,
        {
          ...rest,
          ref,
          className,
        },
        children,
      );
      break;
    case 'p':
      template = React.createElement(
        as,
        {
          ...rest,
          ref,
          className: `${className} text-sm`,
        },
        children,
      );
      break;
    default:
      template = React.createElement(
        as,
        {
          ...rest,
          ref,
          className,
        },
        children,
      );
      break;
  }

  return template;
};

export const Typography = forwardRef(TypographyComponent);
