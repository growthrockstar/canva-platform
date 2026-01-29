import { Canvas } from "@/components/Canvas";
import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#282117] text-[#E8DDCA]">
      <Header />
      <Dashboard />
      <Canvas />
    </div>
  );
}
