import { useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isAdminPage = location === "/admin";

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      {!isAdminPage && <Navbar />}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
