import { AuthForms } from "@/components/auth/AuthForms";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full " />

      <div className="relative z-10 w-full flex flex-col items-center">
        <img
          src="./IMAGOTIPO.png"
          alt="Growth Rockstar"
          className="h-12 mb-8 opacity-80"
        />
        <AuthForms mode="login" />
      </div>
    </div>
  );
}
