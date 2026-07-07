"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XR, useXR } from "@react-three/xr";
import { OrbitControls, Grid } from "@react-three/drei";
import { Suspense, useRef, useMemo, useState, Component, type ReactNode } from "react";
import { DigitalTwin } from "./DigitalTwin";
import { ChallengeProps } from "./ChallengeProps";
import { xrStore } from "./xrStore";
import { usePlainGLTF, preloadPlainGLTF } from "@/lib/plainGltf";
import * as THREE from "three";

interface VRSceneProps {
    robotState: any;
    sendControllerData: (data: any) => void;
    sendAction: (action: string) => void;
}

function SceneCore({ joints }: { joints: number[] }) {
    return (
        <group position={[0, 0.2, -0.4]}>
            <group position={[-0.2, 0.762, -0.625]}>
                <WorkspaceTable />
            </group>
            <DigitalTwin joints={joints} />
        </group>
    );
}

function SceneGrid() {
    const isAR = useXR((state: any) => state.session?.mode === "immersive-ar");
    if (isAR) return null;

    return (
        <Grid infiniteGrid fadeDistance={50} sectionColor="#4a4a4a" cellColor="#666" />
    );
}

function ControllerManager({ sendControllerData, sendAction }: { sendControllerData: any; sendAction: any }) {
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
        const packet: any = {
            timestamp,
            leftController: null,
            rightController: null,
        };
        const referenceSpace = gl.xr.getReferenceSpace();
        if (!referenceSpace) return;

        for (const inputSource of Array.from(session.inputSources)) {
            const hand = inputSource.handedness;
            if (hand === "none") continue;
            if (!inputSource.gripSpace) continue;

            const pose = frame.getPose(inputSource.gripSpace, referenceSpace);
            if (!pose) continue;

            const { position, orientation } = pose.transform;
            const gamepad = inputSource.gamepad;
            const trigger = gamepad?.buttons[0];
            const grip = gamepad?.buttons[1];

            if (hand === "left") {
                const xPressed = gamepad?.buttons[4]?.pressed;
                const wasPressed = prevButtons.current["left"]?.["x"];
                if (xPressed && !wasPressed) {
                    sendAction("record_toggle");
                }
                if (!prevButtons.current["left"]) prevButtons.current["left"] = {};
                prevButtons.current["left"]["x"] = !!xPressed;
            }

            if (hand === "right") {
                const bPressed = gamepad?.buttons[5]?.pressed;
                const wasPressed = prevButtons.current["right"]?.["b"];
                if (bPressed && !wasPressed) {
                    session.end();
                }
                if (!prevButtons.current["right"]) prevButtons.current["right"] = {};
                prevButtons.current["right"]["b"] = !!bPressed;

                const aPressed = gamepad?.buttons[4]?.pressed;
                const aWasPressed = prevButtons.current["right"]?.["a"];
                if (aPressed && !aWasPressed) {
                    sendAction("task_reset");
                }
                prevButtons.current["right"]["a"] = !!aPressed;
            }

            const controllerData = {
                hand,
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: 0, y: 0, z: 0 },
                quaternion: {
                    x: orientation.x,
                    y: orientation.y,
                    z: orientation.z,
                    w: orientation.w,
                },
                gripActive: grip?.pressed || false,
                trigger: trigger?.pressed ? 1 : 0,
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
        }
    });

    return (
        <>
            <XRControllerIndicators />
            <mesh position={[0, 1.5, -0.5]}>
                <sphereGeometry args={[0.02]} />
                <meshBasicMaterial color={sending ? "#00ff00" : "#ff0000"} />
            </mesh>
        </>
    );
}

function WorkspaceTable() {
    const { scene } = usePlainGLTF("/assets/other/table.glb");
    return <primitive object={scene} />;
}

preloadPlainGLTF("/assets/other/table.glb");

function XRControllerIndicators() {
    const inputSourceStates = useXR((state: any) => state.inputSourceStates);

    const controllers = useMemo(
        () => (inputSourceStates || []).filter((s: any) => s.type === "controller"),
        [inputSourceStates]
    );

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

function ChallengeLayer({
    objects,
    task,
}: {
    objects?: any[] | null;
    task?: any | null;
}) {
    const isXR = useXR((state: any) => !!state.session);

    return (
        <group position={[0, 0.2, -0.4]}>
            <ChallengeProps
                objects={objects}
                task={task}
                showLabel={isXR}
            />
        </group>
    );
}

export function VRScene({ robotState, sendControllerData, sendAction }: VRSceneProps) {
    const joints = useMemo(() => {
        if (robotState?.left_arm) return robotState.left_arm;
        return [0, 0, 0, 0, 0, 0];
    }, [robotState]);

    return (
        <div className="relative h-full w-full">
            <Canvas
                style={{ width: "100%", height: "100%" }}
                dpr={[1, 2]}
                gl={{ alpha: true, antialias: true }}
                camera={{ position: [0.5, 1.2, 1.5], fov: 50 }}
            >
                <XR store={xrStore}>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[1, 2, 3]} intensity={1.5} castShadow />

                    <SceneGrid />

                    <Suspense fallback={null}>
                        <SceneCore joints={joints} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <ChallengeLayer objects={robotState?.objects} task={robotState?.task} />
                    </Suspense>

                    <ControllerManager sendControllerData={sendControllerData} sendAction={sendAction} />
                    <OrbitControls makeDefault target={[0, 0.8, -0.3]} />
                </XR>
            </Canvas>
        </div>
    );
}

export default VRScene;

interface SceneErrorBoundaryProps {
    children: ReactNode;
    fallback: ReactNode;
}

interface SceneErrorBoundaryState {
    hasError: boolean;
}

export class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
    state: SceneErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error("VRScene failed to render:", error);
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}
