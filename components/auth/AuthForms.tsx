"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasStore } from '@/lib/store/useCanvasStore';

export const AuthForms = ({ mode = 'login' }: { mode?: 'login' | 'register' }) => {
    const router = useRouter();
    const { setEncryptionPassword, loadCanvas } = useCanvasStore();

    const [isLogin, setIsLogin] = useState(mode === 'login');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // SUCCESS
            // 1. Set Encryption Password (for local decryption)
            setEncryptionPassword(formData.password);

            // 2. Load User Data
            await loadCanvas();

            // 3. Redirect to Canvas
            router.push('/canvas');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {isLogin ? 'Welcome Back' : 'Start Your Growth Journey'}
                </h2>
                <p className="text-zinc-400 text-sm">
                    {isLogin ? 'Enter your credentials to access your canvas.' : 'Create an account to secure your strategy.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase">Password</label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">
                        Used for both login and encrypting your data (Zero Knowledge).
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                    {loading ? 'Processing...' : (isLogin ? 'Access Canvas' : 'Create Account')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
};
