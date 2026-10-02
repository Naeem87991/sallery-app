import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegisterServiceWorker } from '@/components/pwa/register-service-worker';

export const metadata: Metadata = {
  title: {
    default: 'Live Salary Ticker',
    template: '%s · Live Salary Ticker',
  },
  description: 'A private, cloud-backed salary and finance workspace.',
  applicationName: 'Live Salary Ticker',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Salary Ticker',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#07110f',
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
