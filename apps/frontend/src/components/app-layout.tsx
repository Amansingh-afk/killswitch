'use client';

import { TopNav } from './top-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background flex-col">
      <div className="px-4 pt-4 pb-0">
        <TopNav />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}

