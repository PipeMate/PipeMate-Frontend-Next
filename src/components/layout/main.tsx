import React from "react";

interface MainProps {
  children: React.ReactNode;
}

export default function Main({ children }: Readonly<MainProps>) {
  return <main className="flex flex-1 flex-col min-h-0">{children}</main>;
}
