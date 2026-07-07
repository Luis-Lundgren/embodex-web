"use client";

import { useRef, useMemo } from "react";
import { Group, MathUtils, Euler } from "three";
import { useFrame } from "@react-three/fiber";
import { usePlainGLTF, preloadPlainGLTF } from "@/lib/plainGltf";

interface DigitalTwinProps {
    joints: number[]; // [j1, j2, j3, j4, j5, j6] in degrees
    visible?: boolean;
}

const ASSET_PATH = "/assets/robots/so100/glb/";

function Part({ url }: { url: string }) {
    const { scene } = usePlainGLTF(ASSET_PATH + url);
    // Ensure all materials are visible and potentially highlighted
    return <primitive object={scene.clone()} />;
}

export function DigitalTwin({ joints, visible = true }: DigitalTwinProps) {
    const j1Ref = useRef<Group>(null);
    const j2Ref = useRef<Group>(null);
    const j3Ref = useRef<Group>(null);
    const j4Ref = useRef<Group>(null);
    const j5Ref = useRef<Group>(null);
    const j6Ref = useRef<Group>(null);

    // Use Euler with YXZ order to match A-Frame precisely
    const baseRotation = useMemo(() => new Euler(
        MathUtils.degToRad(-90),
        MathUtils.degToRad(180),
        0,
        'YXZ'
    ), []);

    useFrame(() => {
        if (!visible) return;

        // Apply joint rotations (mirroring vr_app.js logic)
        // J1: 0 -1 0 -> y = -angle
        if (j1Ref.current) j1Ref.current.rotation.y = MathUtils.degToRad(-joints[0]);

        // J2: 1 0 0 -> x = angle
        if (j2Ref.current) j2Ref.current.rotation.x = MathUtils.degToRad(joints[1]);

        // J3: 1 0 0 -> x = angle
        if (j3Ref.current) j3Ref.current.rotation.x = MathUtils.degToRad(joints[2]);

        // J4: 1 0 0 -> x = angle
        if (j4Ref.current) j4Ref.current.rotation.x = MathUtils.degToRad(joints[3]);

        // J5: 0 1 0 -> y = angle
        if (j5Ref.current) j5Ref.current.rotation.y = MathUtils.degToRad(joints[4]);

        // J6: 0 0 1 -> z = angle (Gripper)
        if (j6Ref.current) j6Ref.current.rotation.z = MathUtils.degToRad(joints[5]);
    });

    if (!visible) return null;

    return (
        <group position={[-0.2, 0.762, -0.5]} rotation={baseRotation}>
            {/* Base Visuals */}
            <Part url="Base.glb" />
            <Part url="Base_Motor.glb" />

            {/* Joint 1: Shoulder Pan */}
            <group position={[0, -0.0452, 0.0165]} rotation={[MathUtils.degToRad(90), 0, 0]}>
                <group ref={j1Ref}>
                    <Part url="Rotation_Pitch.glb" />
                    <Part url="Rotation_Pitch_Motor.glb" />

                    {/* Joint 2: Shoulder Lift */}
                    <group position={[0, 0.1025, 0.0306]} rotation={[MathUtils.degToRad(-2.86), 0, 0]}>
                        <group ref={j2Ref}>
                            <Part url="Upper_Arm.glb" />
                            <Part url="Upper_Arm_Motor.glb" />

                            {/* Joint 3: Elbow Flex */}
                            <group position={[0, 0.11257, 0.028]} rotation={[0, 0, 0]}>
                                <group ref={j3Ref}>
                                    <Part url="Lower_Arm.glb" />
                                    <Part url="Lower_Arm_Motor.glb" />

                                    {/* Joint 4: Wrist Flex */}
                                    <group position={[0, 0.0052, 0.1349]} rotation={[MathUtils.degToRad(-87.29), 0, 0]}>
                                        <group ref={j4Ref}>
                                            <Part url="Wrist_Pitch_Roll.glb" />
                                            <Part url="Wrist_Pitch_Roll_Motor.glb" />

                                            {/* Joint 5: Wrist Roll */}
                                            <group position={[0, -0.0601, 0]} rotation={[0, MathUtils.degToRad(180), 0]}>
                                                <group ref={j5Ref}>
                                                    <Part url="Fixed_Jaw.glb" />
                                                    <Part url="Fixed_Jaw_Motor.glb" />

                                                    {/* Joint 6: Gripper */}
                                                    <group position={[-0.0202, -0.0244, 0]} rotation={[0, MathUtils.degToRad(180), 0]}>
                                                        <group ref={j6Ref}>
                                                            <Part url="Moving_Jaw.glb" />
                                                        </group>
                                                    </group>
                                                </group>
                                            </group>
                                        </group>
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
}

// Preload assets
preloadPlainGLTF(ASSET_PATH + "Base.glb");
preloadPlainGLTF(ASSET_PATH + "Base_Motor.glb");
preloadPlainGLTF(ASSET_PATH + "Rotation_Pitch.glb");
preloadPlainGLTF(ASSET_PATH + "Rotation_Pitch_Motor.glb");
preloadPlainGLTF(ASSET_PATH + "Upper_Arm.glb");
preloadPlainGLTF(ASSET_PATH + "Upper_Arm_Motor.glb");
preloadPlainGLTF(ASSET_PATH + "Lower_Arm.glb");
preloadPlainGLTF(ASSET_PATH + "Lower_Arm_Motor.glb");
preloadPlainGLTF(ASSET_PATH + "Wrist_Pitch_Roll.glb");
preloadPlainGLTF(ASSET_PATH + "Wrist_Pitch_Roll_Motor.glb");
preloadPlainGLTF(ASSET_PATH + "Fixed_Jaw.glb");
preloadPlainGLTF(ASSET_PATH + "Fixed_Jaw_Motor.glb");
preloadPlainGLTF(ASSET_PATH + "Moving_Jaw.glb");
