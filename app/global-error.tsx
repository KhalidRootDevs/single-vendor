'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-900">
        <div className="space-y-4 px-4 text-center">
          <h1 className="text-6xl font-bold text-red-600">Error</h1>
          <h2 className="text-2xl font-semibold">Application Error</h2>
          <p className="max-w-md text-gray-500">
            A critical error occurred. Please refresh the page.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
