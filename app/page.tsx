"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useCanvasStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/canvas');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse">
        <img src="/LOGOGROWTH.png" alt="Loading..." className="h-12 opacity-50" />
      </div>
    </div>
  );
}
