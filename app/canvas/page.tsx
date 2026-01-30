"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@/components/Canvas";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";
import Tour from "@/components/Tour";

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
            router.replace('/login');
        }
    }, [isAuthChecking, isAuthenticated, router]);

    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-[#282117] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <img src="/LOGOGROWTH.png" alt="Loading..." className="h-12 opacity-50" />
                    <span className="text-white/30 text-sm tracking-widest uppercase">Cargando Estrategia...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null; 

    return <>      <Tour />
        <Header />
        <Dashboard />
        <Canvas></Canvas></>;
}
