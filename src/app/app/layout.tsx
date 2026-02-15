import { Suspense } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
