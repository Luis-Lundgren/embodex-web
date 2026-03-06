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
