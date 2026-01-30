"use client";
import dynamic from "next/dynamic";
import { Canvas } from "@/components/Canvas";
import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";

const Tour = dynamic(() => import("@/components/Tour"), { ssr: false });

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#282117] text-[#E8DDCA]">
      <Tour />
      <Header />
      <Dashboard />
      <Canvas />
    </div>
  );
}
