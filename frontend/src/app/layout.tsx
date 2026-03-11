import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ProjectFlow — Modern Project Management',
  description: 'A powerful, beautiful project management tool built for modern teams.',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(222, 15%, 14%)',
                color: 'hsl(210, 20%, 94%)',
                border: '1px solid hsl(222, 15%, 20%)',
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'DM Sans, system-ui, sans-serif',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: 'white' }
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: 'white' }
              }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
