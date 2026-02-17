'use client';

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import Script from "next/script";

declare global {
    interface Window {
        grecaptcha: any;
    }
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4">
            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                <Script
                    src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
                />
            )}

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Motion Exchange
                        </h1>
                        <p className="text-slate-400 mt-2">Sign in to continue</p>
                    </div>

                    <form
                        className="space-y-4 mb-6"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const email = formData.get("email") as string;
                            const password = formData.get("password") as string;

                            let captchaToken = "mock-token";
                            if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && window.grecaptcha) {
                                captchaToken = await new Promise((resolve) => {
                                    window.grecaptcha.enterprise.ready(async () => {
                                        const token = await window.grecaptcha.enterprise.execute(
                                            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
                                            { action: 'login' }
                                        );
                                        resolve(token);
                                    });
                                });
                            }

                            await signIn("credentials", {
                                email,
                                password,
                                captchaToken, // Passing token to authorize
                                callbackUrl: "/",
                                redirect: true
                            });
                        }}
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        className="w-full bg-white text-slate-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google
                    </button>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-blue-400 hover:text-blue-300">
                            Sign up
                        </Link>
                    </p>
                    <p className="mt-2 text-center text-xs text-slate-500">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>

            {/* Background embellishments */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[100px]" />
            </div>
        </main>
    );
}
