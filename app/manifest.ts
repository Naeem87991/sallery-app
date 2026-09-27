import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Live Salary Ticker',
    short_name: 'Salary Ticker',
    description: 'A private, offline-first salary and personal finance tracker.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07110f',
    theme_color: '#07110f',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
