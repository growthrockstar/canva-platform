"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@/components/Canvas";
import { useCanvasStore } from "@/public/lib/store/useCanvasStore";
import Tour from "@/components/Tour";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileToolbar } from "@/components/MobileToolbar";

export default function CanvasPage() {
  const { isAuthenticated, isAuthChecking, loadCanvas } = useCanvasStore();
  const router = useRouter();

  useEffect(() => {
    // Attempt to load canvas (which checks session) on mount
    loadCanvas();
  }, []);

  useEffect(() => {
    // If done checking and still not authenticated, redirect
    if (!isAuthChecking && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthChecking, isAuthenticated, router]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img
            src="/IMAGOTIPO.png"
            alt="Loading..."
            className="h-12 opacity-50"
          />
          <span className="text-white/30 text-sm tracking-widest uppercase">
            Cargando Estrategia...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#f2f2f2]">
      <Tour />

      <LeftSidebar />

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative pb-20 lg:pb-0">
        <Canvas />
      </main>

      <MobileToolbar />
    </div>
  );
}
