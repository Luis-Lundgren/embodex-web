"use client";

import { Text } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { Euler, MathUtils } from "three";
import { usePlainGLTF, preloadPlainGLTF } from "@/lib/plainGltf";

const ASSET_PATH = "/assets/challenges/fiber_plug/";

export interface ChallengeObject {
    id: string;
    position: number[];   // [x, y, z] in the left-robot base frame (PyBullet Z-up)
    quaternion: number[]; // [qx, qy, qz, qw] in the same frame
    grasped?: boolean;
    static?: boolean;
}

export interface TaskState {
    name: string;
    success: boolean;
    elapsed_s: number;
    attempts: number;
    grasped?: boolean;
}

interface ChallengePropsProps {
    objects?: ChallengeObject[] | null;
    task?: TaskState | null;
    /** Root position of the robot base in the parent frame (defaults to the teleop VR scene layout) */
    position?: [number, number, number];
    /** Show the floating in-XR status label */
    showLabel?: boolean;
}

const OBJECT_MODELS: Record<string, string> = {
    fiber_connector: "fiber_connector.glb",
    port_panel: "port_panel.glb",
};

/** GLB ferrule art faces +Y insertion axis; align white ferrule toward the panel socket hole. */
const CONNECTOR_MODEL_YAW = 0;

function ObjectModel({ obj }: { obj: ChallengeObject }) {
    const file = OBJECT_MODELS[obj.id];
    const { scene } = usePlainGLTF(ASSET_PATH + (file || "fiber_connector.glb"));
    if (!file) return null;
    const model = <primitive object={scene.clone()} />;
    return (
        <group
            position={[obj.position[0], obj.position[1], obj.position[2]]}
            quaternion={[obj.quaternion[0], obj.quaternion[1], obj.quaternion[2], obj.quaternion[3]]}
        >
            {obj.id === "fiber_connector" ? (
                <group rotation={[0, 0, CONNECTOR_MODEL_YAW]}>{model}</group>
            ) : (
                model
            )}
        </group>
    );
}

function TaskLabel({ task, port }: { task: TaskState; port: ChallengeObject }) {
    return (
        <group position={[port.position[0], port.position[1], port.position[2] + 0.2]}>
            <group rotation={[MathUtils.degToRad(90), MathUtils.degToRad(180), 0]}>
                <Text
                    fontSize={0.025}
                    color={task.success ? "#22c55e" : "#e2e8f0"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.002}
                    outlineColor="#020617"
                >
                    {task.success
                        ? `PLUGGED IN  ${task.elapsed_s.toFixed(1)}s`
                        : `FIBER PLUG CHALLENGE  ${task.elapsed_s.toFixed(0)}s  ·  attempt ${task.attempts}`}
                </Text>
            </group>
        </group>
    );
}

/**
 * Renders the fiber-plug challenge props (connector + port panel) streamed
 * from the telegrip backend, plus a floating in-XR status label.
 *
 * Object poses arrive in the left-robot base frame (PyBullet, Z-up). The root
 * group here matches the DigitalTwin root transform exactly, so setting the
 * base-frame pose directly on children lines everything up with the robot.
 */
export function ChallengeProps({ objects, task, position = [-0.2, 0.762, -0.5], showLabel = true }: ChallengePropsProps) {
    // Same root transform as DigitalTwin (components/Teleop/DigitalTwin.tsx)
    const baseRotation = useMemo(() => new Euler(
        MathUtils.degToRad(-90),
        MathUtils.degToRad(180),
        0,
        'YXZ'
    ), []);

    if (!objects || objects.length === 0) {
        return null;
    }

    const port = objects.find(o => o.id === "port_panel");

    return (
        <group position={position} rotation={baseRotation}>
            {objects.map(obj => (
                <ObjectModel key={obj.id} obj={obj} />
            ))}

            {/* Label suspends on troika font load — keep in its own Suspense so GLB props stay visible in XR */}
            {showLabel && task && port && (
                <Suspense fallback={null}>
                    <TaskLabel task={task} port={port} />
                </Suspense>
            )}
        </group>
    );
}

preloadPlainGLTF(ASSET_PATH + "fiber_connector.glb");
preloadPlainGLTF(ASSET_PATH + "port_panel.glb");
