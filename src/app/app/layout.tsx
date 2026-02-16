import { Suspense } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Suspense><div className="h-screen overflow-hidden">{children}</div></Suspense>;
}
