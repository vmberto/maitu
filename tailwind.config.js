// eslint-disable-next-line import/no-extraneous-dependencies
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');
const gray = require('tailwindcss/colors').gray;
const rgb = (hex) =>
  hex
    .match(/[a-f0-9]{2}/gi)
    .map((part) => parseInt(part, 16))
    .join(' ');
const darkGray = {
  50: 950,
  100: 900,
  200: 800,
  300: 700,
  400: 500,
  500: 400,
  600: 300,
  700: 200,
  800: 100,
  900: 50,
  950: 50,
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    colors: ({ colors }) => ({
      primary: '#3664FF',
      danger: '#DE623E',
      success: '#21e824',
      redColor: '#F55C30',
      greenColor: '#25E87B',
      pinkColor: '#E825C7',
      yellowColor: '#eebb15',
      inherit: colors.inherit,
      current: colors.current,
      transparent: colors.transparent,
      black: colors.black,
      white: colors.white,
      slate: colors.slate,
      gray: Object.fromEntries(
        Object.keys(gray).map((shade) => [
          shade,
          `rgb(var(--gray-${shade}) / <alpha-value>)`,
        ]),
      ),
      canvas: 'rgb(var(--canvas) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      panel: 'rgb(var(--panel) / <alpha-value>)',
      field: 'rgb(var(--field) / <alpha-value>)',
      zinc: colors.zinc,
      neutral: colors.neutral,
      stone: colors.stone,
      red: colors.red,
      orange: colors.orange,
      amber: colors.amber,
      yellow: colors.yellow,
      lime: colors.lime,
      green: colors.green,
      emerald: colors.emerald,
      teal: colors.teal,
      cyan: colors.cyan,
      sky: colors.sky,
      blue: colors.blue,
      indigo: colors.indigo,
      violet: colors.violet,
      purple: colors.purple,
      fuchsia: colors.fuchsia,
      pink: colors.pink,
      rose: colors.rose,
    }),
    borderWidth: {
      ...defaultTheme.borderWidth,
      detail: '18px',
      'detail-hover': '36px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      screens: {
        betterhover: { raw: '(hover: hover)' },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) =>
      addBase({
        ':root': {
          '--canvas': '255 255 255',
          '--surface': '255 255 255',
          '--panel': rgb(gray[50]),
          '--field': '255 255 255',
          ...Object.fromEntries(
            Object.entries(gray).map(([shade, value]) => [
              `--gray-${shade}`,
              rgb(value),
            ]),
          ),
        },
        'html.dark': {
          '--canvas': rgb(gray[950]),
          '--surface': rgb(gray[900]),
          '--panel': rgb(gray[800]),
          '--field': rgb(gray[950]),
          ...Object.fromEntries(
            Object.entries(darkGray).map(([shade, value]) => [
              `--gray-${shade}`,
              rgb(gray[value]),
            ]),
          ),
        },
      }),
    ),
  ],
};
