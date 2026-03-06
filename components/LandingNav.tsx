"use client";

import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";

export default function LandingNav() {
    const { data: session } = useSession();
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#141414]/95 backdrop-blur-md border-b border-white/5 px-6 md:px-12 flex items-center justify-between text-white">
            {/* Left side: Branding */}
            <div className="flex items-center">
                <span className="font-semibold text-xl tracking-tight text-gray-100">SO-100 Motion Exchange</span>
            </div>

            {/* Center: Main Links */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-10 text-sm font-medium text-gray-400">
                <Link href="/explore" className="hover:text-white transition-colors duration-200">
                    Explore
                </Link>
                <Link href="/teleop" className="hover:text-white transition-colors duration-200">
                    Teleop
                </Link>
            </div>

            {/* Right side: Auth Links or User Info */}
            <div className="flex items-center gap-6 text-sm font-medium">
                {session ? (
                    <div className="flex items-center gap-4">
                        <span className="text-gray-300">
                            {session.user?.name || 'User'}
                        </span>
                        <button
                            onClick={() => signOut()}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            Sign out
                        </button>
                    </div>
                ) : (
                    <>
                        <Link href="/login" className="text-gray-400 hover:text-white transition-colors duration-200">
                            Log in
                        </Link>
                        <Link href="/signup" className="text-gray-400 hover:text-white transition-colors duration-200">
                            Sign up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
