'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CallProvider } from '@/lib/contexts/CallContext';
import { CallUI } from '@/components/call';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <CallProvider>
          {children}
          <CallUI />
        </CallProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
