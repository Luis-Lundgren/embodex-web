"use client";

import { useXR } from "@react-three/xr";
import { useState, useEffect } from "react";
import { xrStore } from "./VRScene";

import Link from 'next/link';

interface TaskStatus {
    name: string;
    success: boolean;
    elapsed_s: number;
    attempts: number;
    grasped?: boolean;
}

interface ControlsProps {
    isConnected: boolean;
    isRecording: boolean;
    robotEngaged: boolean;
    sessionId?: string | null;
    task?: TaskStatus | null;
    connectRobot: () => void;
    toggleRecording: () => void;
    resetTask?: () => void;
    className?: string;
}

export function TeleopControls({ isConnected, isRecording, robotEngaged, sessionId, task, connectRobot, toggleRecording, resetTask, className = "" }: ControlsProps) {
    // Removed useXR to avoid context error outside Canvas
    // Browser usually hides DOM in VR anyway

    return (
        <div className={`absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-auto z-10 flex flex-col gap-3 md:gap-4 p-4 bg-gray-900/80 backdrop-blur-md rounded-xl text-white border border-gray-700 w-auto md:w-80 ${className}`}>
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Teleop Suite
                </h2>
                <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded">
                    Exit
                </Link>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Backend Status:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isConnected ? "CONNECTED" : "DISCONNECTED"}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Robot Motors:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${robotEngaged ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {robotEngaged ? "ENGAGED" : "DISENGAGED"}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Recording:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {isRecording ? "REC ●" : "STOPPED"}
                    </span>
                </div>
                {sessionId && (
                    <div className="text-[10px] font-mono text-white/40 truncate" title={sessionId}>
                        Session: {sessionId}
                    </div>
                )}
            </div>

            {task && (
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Challenge:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${task.success
                            ? 'bg-green-500/20 text-green-400'
                            : task.grasped
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-700 text-gray-400'}`}>
                            {task.success ? "PLUGGED IN ✓" : task.grasped ? "CABLE GRASPED" : "IN PROGRESS"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                        <span title={task.name}>{task.name}</span>
                        <span>{task.elapsed_s.toFixed(1)}s · attempt {task.attempts}</span>
                    </div>
                    <button
                        onClick={resetTask}
                        disabled={!isConnected}
                        className="w-full py-1.5 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                    >
                        Reset Task
                    </button>
                </div>
            )}

            <div className="space-y-2 pt-2 border-t border-gray-700">
                <button
                    onClick={connectRobot}
                    disabled={!isConnected}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                    {robotEngaged ? "Reconnect / Reset" : "Connect Robot"}
                </button>

                <button
                    onClick={toggleRecording}
                    disabled={!isConnected}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${isRecording
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        }`}
                >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                </button>

                <button
                    onClick={() => xrStore.enterAR()}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors mt-2"
                >
                    Enter XR
                </button>
            </div>

            <div className="text-xs text-gray-500 pt-2">
                <p>Instructions:</p>
                <ul className="list-disc ml-4 space-y-1 mt-1">
                    <li>Click "Enter XR" button above (WebXR).</li>
                    <li>Hold Grip to move arm.</li>
                    <li>Hold Trigger to close gripper.</li>
                    <li>Press 'X' on Left controller to toggle recording.</li>
                    <li>Press 'A' on Right controller to reset the challenge.</li>
                    <li>Goal: plug the fiber cable into the port.</li>
                </ul>
            </div>
        </div>
    );
}
