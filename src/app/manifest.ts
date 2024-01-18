import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'maitu',
    description: 'an application to save your goals',
    short_name: 'maitu',
    theme_color: '#ffffff',
    background_color: '#3664FF',
    display: 'fullscreen',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
  };
}
