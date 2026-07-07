"use client";

import { useEffect, useState } from "react";

/** Shown while search params resolve and/or the 3D teleop bundle downloads. */
export function TeleopLoading() {
    const [slow, setSlow] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setSlow(true), 4000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="font-mono uppercase tracking-[0.3em] text-sm text-white/60">
                Loading Teleop Interface...
            </p>
            {slow && (
                <p className="max-w-sm text-center text-xs text-white/40 px-6 leading-relaxed">
                    Still loading — the 3D engine is a large download on first visit.
                    Check your connection, disable ad blockers for this site, then refresh.
                </p>
            )}
        </div>
    );
}
