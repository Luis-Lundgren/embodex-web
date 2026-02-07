"use client";

import React, { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment, ContactShadows } from "@react-three/drei";
import { RobotModel } from "./RobotModel";
import * as THREE from "three";

interface ViewerSceneProps {
    jointPositions: number[];
}

export default function ViewerScene({ jointPositions }: ViewerSceneProps) {
    const [eePosition, setEEPosition] = useState<THREE.Vector3>(new THREE.Vector3());

    const handleEEUpdate = useCallback((pos: THREE.Vector3) => {
        setEEPosition(pos.clone());
    }, []);

    return (
        <div className="w-full h-full bg-slate-950 overflow-hidden relative">
            <Canvas shadows camera={{ position: [0.6, 0.4, 0.8], fov: 45 }}>
                <Suspense fallback={null}>
                    <color attach="background" args={["#020617"]} />
                    <Environment preset="city" />
                    <ambientLight intensity={1} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                    <directionalLight position={[5, 10, 5]} intensity={2} castShadow />

                    <RobotModel jointPositions={jointPositions} onEEUpdate={handleEEUpdate} />

                    <ContactShadows
                        position={[0, 0, 0]}
                        opacity={0.4}
                        scale={10}
                        blur={2.5}
                        far={0.5}
                    />

                    <Grid
                        renderOrder={-1}
                        position={[0, 0, 0]}
                        infiniteGrid
                        cellSize={0.05}
                        sectionSize={0.25}
                        fadeDistance={15}
                        sectionColor="#3b82f6"
                        cellColor="#10b981"
                        sectionThickness={2}
                    />
                    <GizmoHelper
                        alignment="bottom-right"
                        margin={[80, 80]}
                    >
                        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
                    </GizmoHelper>
                </Suspense>
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
            </Canvas>

            {/* Subtle Telemetry Overlay (Bottom Left) */}
            <div className="absolute bottom-16 left-6 p-4 flex flex-col gap-1 pointer-events-none z-10 bg-slate-900/40 backdrop-blur-md rounded-lg border border-white/5 shadow-2xl">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 border-b border-white/5 pb-1">Telemetry</div>
                <div className="flex gap-4 font-mono text-[9px] text-white/40 font-bold uppercase">
                    <span>X: <span className="text-white">{eePosition.x.toFixed(3)}</span></span>
                    <span>Y: <span className="text-white">{eePosition.y.toFixed(3)}</span></span>
                    <span>Z: <span className="text-white">{eePosition.z.toFixed(3)}</span></span>
                </div>
            </div>

            {/* WebXR Toggle Button Placeholder */}
            <div className="absolute bottom-4 right-4 z-10">
                {/* XR logic would go here */}
            </div>
        </div>
    );
}
