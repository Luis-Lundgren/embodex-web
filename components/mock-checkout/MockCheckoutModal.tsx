"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MockCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    amountCents: number;
    referenceType: "dataset" | "job_request";
    referenceId: string;
    itemName: string;
}

export default function MockCheckoutModal({
    isOpen,
    onClose,
    amountCents,
    referenceType,
    referenceId,
    itemName
}: MockCheckoutModalProps) {
    const router = useRouter();
    const [method, setMethod] = useState("mock_card");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handlePay = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/mock-payments/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amountCents,
                    method,
                    referenceType,
                    referenceId,
                    type: referenceType === 'dataset' ? 'purchase' : 'request_funding'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Payment failed");

            setSuccess(true);
            setTimeout(() => {
                router.refresh();
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
                {!success ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Mock Checkout</h2>
                            <span className="px-2 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-md ring-1 ring-indigo-500/50">DEMO</span>
                        </div>

                        <div className="mb-6 rounded-xl bg-slate-800 p-5 border border-slate-700">
                            <p className="text-sm font-medium text-slate-400 mb-1">Purchasing</p>
                            <p className="font-semibold text-white text-lg">{itemName}</p>
                            <div className="mt-4 flex items-end justify-between border-t border-slate-700/50 pt-4">
                                <span className="text-slate-400 font-medium">Total Due</span>
                                <span className="text-3xl font-bold text-white">
                                    ${(amountCents / 100).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <p className="mb-3 text-sm font-medium text-slate-400">Select payment method:</p>
                        <div className="mb-8 space-y-3">
                            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:border-indigo-500 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`h-5 w-5 rounded-full border border-slate-500 flex items-center justify-center transition-colors ${method === 'mock_card' ? 'border-none bg-indigo-500' : ''}`}>
                                        {method === 'mock_card' && <div className="h-2 w-2 rounded-full bg-white transition-transform scale-100" />}
                                    </div>
                                    <span className="font-medium text-slate-200">Mock Credit Card</span>
                                </div>
                                <span className="text-2xl">💳</span>
                                <input
                                    type="radio"
                                    name="method"
                                    value="mock_card"
                                    checked={method === "mock_card"}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="hidden"
                                />
                            </label>

                            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:border-indigo-500 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`h-5 w-5 rounded-full border border-slate-500 flex items-center justify-center transition-colors ${method === 'mock_ach' ? 'border-none bg-indigo-500' : ''}`}>
                                        {method === 'mock_ach' && <div className="h-2 w-2 rounded-full bg-white transition-transform scale-100" />}
                                    </div>
                                    <span className="font-medium text-slate-200">Mock ACH Transfer</span>
                                </div>
                                <span className="text-2xl">🏦</span>
                                <input
                                    type="radio"
                                    name="method"
                                    value="mock_ach"
                                    checked={method === "mock_ach"}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {error && <p className="mb-5 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500 ring-1 ring-red-500/20">{error}</p>}

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 rounded-xl bg-slate-800 py-3.5 font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePay}
                                disabled={loading}
                                className="flex-[2] rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center group"
                            >
                                {loading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-bottom-transparent" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Pay ${(amountCents / 100).toFixed(2)}
                                        <span className="transition-transform group-hover:translate-x-1">→</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center py-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400 ring-4 ring-green-500/10">
                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-white">Payment Successful!</h2>
                        <p className="text-slate-400">Your mock transaction has been processed.</p>
                        <div className="mt-6 w-full rounded-xl bg-slate-800 p-5 border border-slate-700 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-bl-full" />
                            <p className="text-sm font-semibold text-slate-300">Mock Receipt Generated</p>
                            <p className="mt-1 text-sm text-slate-500">View this transaction in your lab payment history.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
