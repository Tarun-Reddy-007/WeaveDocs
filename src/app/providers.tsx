'use client';

import { HierarchyProvider } from '@/lib/HierarchyContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <HierarchyProvider>{children}</HierarchyProvider>;
}
