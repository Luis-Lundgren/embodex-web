"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XR, useXR } from "@react-three/xr";
import { OrbitControls, Environment, Grid, useGLTF } from "@react-three/drei";
import { useRef, useMemo, useState, useEffect } from "react";
import { DigitalTwin } from "./DigitalTwin";
import { ChallengeProps } from "./ChallengeProps";
import { xrStore } from "./xrStore";
import * as THREE from "three";

interface VRSceneProps {
    robotState: any;
    sendControllerData: (data: any) => void;
    sendAction: (action: string) => void;
}

function ControllerManager({ sendControllerData, sendAction }: { sendControllerData: any, sendAction: any }) {
    const { gl } = useThree();
    const prevButtons = useRef<{ [key: string]: { [btn: string]: boolean } }>({});
    const [sending, setSending] = useState(false);

    useFrame((state, delta, frame) => {
        const session = gl.xr.getSession();
        if (!session || !frame) {
            if (sending) setSending(false);
            return;
        }

        const timestamp = Date.now();
        // Backend (vr_ws_server.py) expects BOTH keys
        const packet: any = {
            timestamp,
            leftController: null,
            rightController: null
        };
        const referenceSpace = gl.xr.getReferenceSpace();
        if (!referenceSpace) return;

        let hasController = false;

        for (const inputSource of Array.from(session.inputSources)) {
            const hand = inputSource.handedness;
            if (hand === 'none') continue;
            if (!inputSource.gripSpace) continue;

            const pose = frame.getPose(inputSource.gripSpace, referenceSpace);
            if (!pose) continue;

            hasController = true;
            const { position, orientation } = pose.transform;
            const gamepad = inputSource.gamepad;
            const trigger = gamepad?.buttons[0];
            const grip = gamepad?.buttons[1];

            // Detect X button (Left hand button 4)
            if (hand === 'left') {
                const xPressed = gamepad?.buttons[4]?.pressed;
                const wasPressed = prevButtons.current['left']?.['x'];
                if (xPressed && !wasPressed) {
                    console.log("X Button Pressed - Toggling Recording");
                    sendAction('record_toggle');
                }
                if (!prevButtons.current['left']) prevButtons.current['left'] = {};
                prevButtons.current['left']['x'] = !!xPressed;
            }

            // Detect B button (Right hand button 5) or Menu button to Exit VR
            if (hand === 'right') {
                const bPressed = gamepad?.buttons[5]?.pressed;
                const wasPressed = prevButtons.current['right']?.['b'];
                if (bPressed && !wasPressed) {
                    console.log("B Button Pressed - Exiting XR");
                    session.end();
                }
                if (!prevButtons.current['right']) prevButtons.current['right'] = {};
                prevButtons.current['right']['b'] = !!bPressed;

                // A button (Right hand button 4) resets the challenge task
                const aPressed = gamepad?.buttons[4]?.pressed;
                const aWasPressed = prevButtons.current['right']?.['a'];
                if (aPressed && !aWasPressed) {
                    console.log("A Button Pressed - Resetting Task");
                    sendAction('task_reset');
                }
                prevButtons.current['right']['a'] = !!aPressed;
            }

            const controllerData = {
                hand,
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: 0, y: 0, z: 0 },
                quaternion: {
                    x: orientation.x,
                    y: orientation.y,
                    z: orientation.z,
                    w: orientation.w
                },
                gripActive: grip?.pressed || false,
                trigger: trigger?.pressed ? 1 : 0
            };

            const euler = new THREE.Euler().setFromQuaternion(
                new THREE.Quaternion(orientation.x, orientation.y, orientation.z, orientation.w)
            );
            controllerData.rotation.x = THREE.MathUtils.radToDeg(euler.x);
            controllerData.rotation.y = THREE.MathUtils.radToDeg(euler.y);
            controllerData.rotation.z = THREE.MathUtils.radToDeg(euler.z);

            if (hand === "left") packet.leftController = controllerData;
            if (hand === "right") packet.rightController = controllerData;
        }

        if (packet.leftController || packet.rightController) {
            sendControllerData(packet);
            if (!sending) setSending(true);

            // Debug log every ~60 frames (1 sec)
            if (state.clock.elapsedTime % 1.0 < 0.02) {
                console.log("Sending VR Packet:", packet);
            }
        }
    });

    return (
        <>
            <XRControllerIndicators />

            {/* Debug Status Sphere floating in front of user */}
            <mesh position={[0, 1.5, -0.5]}>
                <sphereGeometry args={[0.02]} />
                <meshBasicMaterial color={sending ? "#00ff00" : "#ff0000"} />
            </mesh>
        </>
    );
}

function WorkspaceTable() {
    const { scene } = useGLTF("/assets/other/table.glb");
    return <primitive object={scene} />;
}

useGLTF.preload("/assets/other/table.glb");

function XRControllerIndicators() {
    const inputSourceStates = useXR((state: any) => state.inputSourceStates);

    const controllers = useMemo(() =>
        (inputSourceStates || []).filter((s: any) => s.type === 'controller'),
        [inputSourceStates]);

    return (
        <>
            {controllers.map((state: any) => (
                <ControllerVisual key={state.id} inputSource={state.inputSource} />
            ))}
        </>
    );
}

function ControllerVisual({ inputSource }: { inputSource: XRInputSource }) {
    const groupRef = useRef<THREE.Group>(null);
    const { gl } = useThree();

    useFrame((state, delta, frame) => {
        if (!frame || !groupRef.current) return;
        const referenceSpace = gl.xr.getReferenceSpace();
        if (!referenceSpace || !inputSource.gripSpace) return;

        const pose = frame.getPose(inputSource.gripSpace, referenceSpace);
        if (pose) {
            const { position, orientation } = pose.transform;
            groupRef.current.position.set(position.x, position.y, position.z);
            groupRef.current.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
        }
    });

    const isTriggerDown = inputSource.gamepad?.buttons[0]?.pressed;
    const isGripDown = inputSource.gamepad?.buttons[1]?.pressed;

    return (
        <group ref={groupRef}>
            {/* Axis indicators like telegrip */}
            <mesh position={[0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.003, 0.003, 0.08]} />
                <meshBasicMaterial color="red" />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.003, 0.003, 0.08]} />
                <meshBasicMaterial color="green" />
            </mesh>
            <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.003, 0.003, 0.08]} />
                <meshBasicMaterial color="blue" />
            </mesh>

            {/* Visual feedback for buttons */}
            <mesh position={[0, 0, -0.02]}>
                <sphereGeometry args={[0.015]} />
                <meshBasicMaterial
                    color={isTriggerDown || isGripDown ? "#3b82f6" : "#444"}
                    transparent
                    opacity={0.6}
                />
            </mesh>
        </group>
    );
}

export function VRScene({ robotState, sendControllerData, sendAction }: VRSceneProps) {
    const joints = useMemo(() => {
        if (robotState?.left_arm) return robotState.left_arm;
        return [0, 0, 0, 0, 0, 0];
    }, [robotState]);

    // #region agent log
    useEffect(() => {
        fetch('http://127.0.0.1:7759/ingest/2a8bebe3-42de-41ab-937c-69e24e1e5899',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'985bef'},body:JSON.stringify({sessionId:'985bef',hypothesisId:'H-E',location:'VRScene.tsx:mount',message:'VRScene mounted',data:{hasRobotState:!!robotState,objectCount:robotState?.objects?.length||0,objectIds:(robotState?.objects||[]).map((o:any)=>o.id),joints},timestamp:Date.now()})}).catch(()=>{});
    }, []);
    // #endregion

    return (
        <Canvas gl={{ alpha: true, antialias: true }}>
            <XR store={xrStore}>
                <ControllerManager sendControllerData={sendControllerData} sendAction={sendAction} />

                <ambientLight intensity={1.5} />
                <directionalLight position={[1, 2, 3]} intensity={1.5} castShadow />

                <group position={[0, 0.2, -0.4]}>
                    {/* Workspace table under the robot base; rear edge flush with the back of the base */}
                    <group position={[-0.2, 0.762, -0.625]}>
                        <WorkspaceTable />
                    </group>
                    <DigitalTwin joints={joints} />
                    <ChallengeProps objects={robotState?.objects} task={robotState?.task} />
                </group>

                {/* Only show helpful visuals when NOT in AR/Passthrough */}
                <SceneBackground />
                <OrbitControls makeDefault />
            </XR>
        </Canvas>
    );
}

function SceneBackground() {
    const isAR = useXR((state: any) => state.session?.mode === 'immersive-ar');

    if (isAR) return null;

    return (
        <>
            <Grid infiniteGrid fadeDistance={50} sectionColor="#4a4a4a" cellColor="#666" />
            <Environment preset="city" />
        </>
    );
}
