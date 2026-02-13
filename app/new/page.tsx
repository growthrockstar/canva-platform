"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/public/lib/store/useCanvasStore";
import { ModulesOverview } from "@/new/ModulesOverview";

export default function NewPage() {
  const { isAuthenticated, isAuthChecking, loadCanvas, fetchSections } =
    useCanvasStore();
  const router = useRouter();

  useEffect(() => {
    void Promise.allSettled([loadCanvas(), fetchSections()]);
  }, [loadCanvas, fetchSections]);

  useEffect(() => {
    if (!isAuthChecking && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthChecking, isAuthenticated, router]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Image
            src="/IMAGOTIPO.png"
            alt="Loading..."
            width={180}
            height={48}
            className="h-12 opacity-50"
          />
          <span className="text-black/30 text-sm tracking-widest uppercase">
            Cargando vista general...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <ModulesOverview />;
}
