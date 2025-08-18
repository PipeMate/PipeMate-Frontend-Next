import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Readonly<MainLayoutProps>) {
  return <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>;
}
