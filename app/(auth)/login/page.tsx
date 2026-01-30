import { AuthForms } from '@/components/auth/AuthForms';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15),transparent_50%)]" />

            <div className="relative z-10 w-full flex flex-col items-center">
                <img src="/LOGOGROWTH.png" alt="Growth Rockstar" className="h-12 mb-8 opacity-80" />
                <AuthForms mode="login" />
            </div>
        </div>
    );
}
