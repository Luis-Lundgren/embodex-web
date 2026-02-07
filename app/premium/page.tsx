"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function PremiumPage() {
    const [activeTab, setActiveTab] = useState<'submit' | 'request'>('submit');
    const [email, setEmail] = useState('');
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: activeTab,
                email,
                payload: { details }
            })
        });

        if (res.ok) {
            setSubmitted(true);
        } else {
            alert("Failed to submit");
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-bold mb-4 text-green-400">Success!</h1>
                <p className="text-xl text-gray-400 mb-8">
                    Your request has been received. We will contact you at {email}.
                </p>
                <Link href="/" className="btn-primary">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-2xl">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Premium Services</h1>
                <p className="text-gray-400">Submit your expert trajectories or request specific data.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8 bg-white/5 rounded-full p-1 w-max mx-auto">
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'submit' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'}`}
                >
                    Submit Dataset
                </button>
                <button
                    onClick={() => setActiveTab('request')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'request' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-400 hover:text-white'}`}
                >
                    Request Data
                </button>
            </div>

            {/* Form Panel */}
            <div className="glass-panel">
                <h2 className="text-2xl font-bold mb-6">
                    {activeTab === 'submit' ? 'Monetize Your SO-100 Motions' : 'Request Custom Trajectories'}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            {activeTab === 'submit' ? 'Dataset Description & Price' : 'Describe what you need'}
                        </label>
                        <textarea
                            required
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={5}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder={activeTab === 'submit' ? "e.g. 50 episodes of precise pouring tasks. Asking $50." : "e.g. I need 100 episodes of picking up strawberries."}
                        />
                    </div>

                    <button type="submit" className={`btn-primary w-full ${activeTab === 'request' ? '!bg-emerald-500 !shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''}`}>
                        {activeTab === 'submit' ? 'Submit for Review' : 'Send Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}
