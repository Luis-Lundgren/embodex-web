'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, ClipboardList, Info } from 'lucide-react';

export default function RequestForm() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'request',
                    payload: {
                        title,
                        description,
                        budget
                    }
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/'), 2000);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit request');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-2xl p-12 text-center backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                    <Send className="text-white w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
                <p className="text-slate-400">Our teleoperators will be notified of your request.</p>
                <p className="text-slate-500 text-sm mt-4 italic">Redirecting you to the exchange...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <ClipboardList className="text-purple-400 w-6 h-6" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">New Teleoperation Request</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">
                            Task Title
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-700"
                            placeholder="e.g. 50 episodes of precise lego block stacking"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">
                            Detailed Description
                        </label>
                        <textarea
                            required
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-700 resize-none"
                            placeholder="Specify camera angles, environment setup, and success criteria..."
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">
                            Budget Range (Optional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                            <input
                                type="text"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-700"
                                placeholder="e.g. 100-250"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <Info className="text-purple-400 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-400 leading-relaxed">
                    Once submitted, your request will be visible to all verified Teleoperators. You can review submissions and purchase the resulting datasets directly through your dashboard.
                </p>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
                {isSubmitting ? 'Posting Request...' : 'Post Request to Marketplace'}
            </button>
        </form>
    );
}
