import React from "react";

interface MainProps {
  children: React.ReactNode;
}

export default function Main({ children }: Readonly<MainProps>) {
  return (
    <main className="flex flex-1 flex-col justify-center items-center gap-4 p-4">
      {children}
    </main>
  );
}
