"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@/components/Canvas";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";
import Tour from "@/components/Tour";

export default function CanvasPage() {
    const { encryptionPassword } = useCanvasStore();
    const router = useRouter();

    // Basic Protection Check
    useEffect(() => {
        // Middleware protects this route server-side.
        // This check handles local state (e.g. if user cleared storage but has cookie).
        if (!encryptionPassword) {
            router.replace('/login');
        }
    }, [encryptionPassword, router]);

    if (!encryptionPassword) return null; // Prevent flash

    return <>      <Tour />
        <Header />
        <Dashboard />
        <Canvas></Canvas></>;
}
