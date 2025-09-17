'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" reverseOrder={false} />

      {/* 🔥 Top Bar Loader */}
      <ProgressBar
        height="3px"
        color="#2563eb" // Tailwind blue-600 (change as needed)
        options={{ showSpinner: false }}
        shallowRouting
      />
    </SessionProvider>
  );
}
