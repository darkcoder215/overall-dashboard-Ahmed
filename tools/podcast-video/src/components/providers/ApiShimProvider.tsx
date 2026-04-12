'use client';

import { useEffect } from 'react';
import { installStaticApiShim } from '@/lib/staticApiShim';

/**
 * Installs the static-export API shim exactly once on the client.
 * Under `next dev` this is a no-op (NEXT_PUBLIC_STATIC_EXPORT is unset).
 */
export default function ApiShimProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installStaticApiShim();
  }, []);
  return <>{children}</>;
}
