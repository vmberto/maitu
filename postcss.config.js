import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import config from './tailwind.config.cjs';
export default { plugins: [tailwind(config), autoprefixer()] };
