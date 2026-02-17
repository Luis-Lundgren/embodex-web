'use client';

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Missing verification token");
            return;
        }

        fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    setStatus("success");
                } else {
                    setStatus("error");
                    setMessage(data.error || "Verification failed");
                }
            })
            .catch(() => {
                setStatus("error");
                setMessage("Something went wrong");
            });
    }, [token]);

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center max-w-md w-full">
            {status === "loading" && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <h1 className="text-2xl font-bold text-white">Verifying...</h1>
                </div>
            )}
            {status === "success" && (
                <div className="flex flex-col items-center gap-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
                    <p className="text-slate-400">Your account has been successfully verified.</p>
                    <Link href="/login" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 transition-colors block mt-4">
                        Continue to Login
                    </Link>
                </div>
            )}
            {status === "error" && (
                <div className="flex flex-col items-center gap-4">
                    <XCircle className="w-16 h-16 text-red-500" />
                    <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
                    <p className="text-red-400">{message}</p>
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 mt-4">
                        Back to Login
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4">
            <div className="relative z-10 w-full flex justify-center">
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <VerifyContent />
                </Suspense>
            </div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[100px]" />
            </div>
        </main>
    );
}
