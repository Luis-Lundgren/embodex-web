"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PreviewScene = dynamic(() => import('./PreviewScene'), { ssr: false });

interface GalleryItemProps {
    dataset: any;
    isActive: boolean;
    onClick: () => void;
}

export function GalleryItem({ dataset: d, isActive, onClick }: GalleryItemProps) {
    const [previewData, setPreviewData] = useState<any>(null);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const res = await fetch(`/api/datasets/${d.id}/data?episode=episode_000`);
                const json = await res.json();
                setPreviewData(json);
            } catch (e) {
                console.error("Preview failed", e);
            }
        };
        fetchPreview();
    }, [d.id]);

    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer bg-slate-900 border flex flex-col transition-all duration-150 relative h-[240px] ${isActive
                ? d.isPremium
                    ? 'border-[#ff9d00] border-2 shadow-[0_0_20px_rgba(255,157,0,0.2)] z-10'
                    : 'border-blue-500 border-2 shadow-[0_0_20px_rgba(59,130,246,0.2)] z-10'
                : 'border-white/5 hover:border-white/20'
                }`}
        >
            {/* Thumbnail Area */}
            <div className={`flex-grow bg-black relative overflow-hidden flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                }`}>
                {previewData && previewData.joint_positions ? (
                    <div className="w-full h-full pointer-events-none">
                        <PreviewScene
                            jointPositions={previewData.joint_positions}
                            fps={previewData.fps}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}

                {d.isPremium ? (
                    <div className="absolute top-2 right-2">
                        <div className="bg-[#ff9d00] text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow uppercase">
                            ${d.price}
                        </div>
                    </div>
                ) : (
                    <div className="absolute top-2 right-2">
                        <div className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow uppercase">
                            Free
                        </div>
                    </div>
                )}
            </div>

            {/* Title Strip */}
            <div className={`px-2.5 py-2 border-t ${isActive ? 'bg-slate-800 border-white/10' : 'bg-slate-900 border-white/5'}`}>
                <h3 className={`text-[12px] font-bold truncate leading-tight ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {d.title}
                </h3>
            </div>
        </div>
    );
}
