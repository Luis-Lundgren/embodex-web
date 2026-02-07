import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import * as THREE from "three";

// Asset paths - assuming they are in public/assets/robots/so100/glb/
const ASSET_PATH = "/assets/robots/so100/glb";

interface RobotModelProps {
    jointPositions: number[]; // [j1, j2, j3, j4, j5, j6] in degrees
    onEEUpdate?: (pos: THREE.Vector3) => void;
}

// Preload GLBs
const files = [
    "Base.glb", "Base_Motor.glb",
    "Rotation_Pitch.glb", "Rotation_Pitch_Motor.glb",
    "Upper_Arm.glb", "Upper_Arm_Motor.glb",
    "Lower_Arm.glb", "Lower_Arm_Motor.glb",
    "Wrist_Pitch_Roll.glb", "Wrist_Pitch_Roll_Motor.glb",
    "Fixed_Jaw.glb", "Fixed_Jaw_Motor.glb",
    "Moving_Jaw.glb"
];

files.forEach(f => useGLTF.preload(`${ASSET_PATH}/${f}`));

export function RobotModel({ jointPositions, onEEUpdate }: RobotModelProps) {
    const group = useRef<Group>(null);
    const eeRef = useRef<Group>(null);

    // Default angles if not provided, pad with zeros if shortened
    const angles = [...(jointPositions || [0, 0, 0, 0, 0, 0]), 0, 0, 0, 0, 0, 0].slice(0, 6);

    // Load models
    const { scene: rotPitch } = useGLTF(`${ASSET_PATH}/Rotation_Pitch.glb`);
    const { scene: rotPitchMotor } = useGLTF(`${ASSET_PATH}/Rotation_Pitch_Motor.glb`);

    const { scene: upperArm } = useGLTF(`${ASSET_PATH}/Upper_Arm.glb`);
    const { scene: upperArmMotor } = useGLTF(`${ASSET_PATH}/Upper_Arm_Motor.glb`);

    const { scene: lowerArm } = useGLTF(`${ASSET_PATH}/Lower_Arm.glb`);
    const { scene: lowerArmMotor } = useGLTF(`${ASSET_PATH}/Lower_Arm_Motor.glb`);

    const { scene: wristPR } = useGLTF(`${ASSET_PATH}/Wrist_Pitch_Roll.glb`);
    const { scene: wristPRMotor } = useGLTF(`${ASSET_PATH}/Wrist_Pitch_Roll_Motor.glb`);

    const { scene: fixedJaw } = useGLTF(`${ASSET_PATH}/Fixed_Jaw.glb`);
    const { scene: fixedJawMotor } = useGLTF(`${ASSET_PATH}/Fixed_Jaw_Motor.glb`);

    const { scene: movingJaw } = useGLTF(`${ASSET_PATH}/Moving_Jaw.glb`);

    // Helper to clone scenes to avoid mutation issues if multiple robots valid
    const clone = (scene: any) => scene.clone();

    // Convert degrees to radians
    const rad = (deg: number) => THREE.MathUtils.degToRad(deg);

    useFrame(() => {
        if (eeRef.current && onEEUpdate) {
            const worldPos = new THREE.Vector3();
            eeRef.current.getWorldPosition(worldPos);
            onEEUpdate(worldPos);
        }
    });

    return (
        <group ref={group} dispose={null} rotation={[Math.PI / 2, Math.PI, 0]}>
            {/* Root rotation matched from vr_app.js: "-90 180 0" = [-PI/2, PI, 0] */}
            {/* position z offset lifts it onto the grid floor */}

            {/* Base */}
            <primitive object={clone(useGLTF(`${ASSET_PATH}/Base.glb`).scene)} />
            <primitive object={clone(useGLTF(`${ASSET_PATH}/Base_Motor.glb`).scene)} />

            {/* Joint 1: Shoulder Pan */}
            {/* Position: 0 -0.0452 0.0165, BaseRot: 90 0 0 */}
            <group position={[0, -0.0452, 0.0165]} rotation={[rad(90), rad(-angles[0]), 0]}>
                <primitive object={clone(rotPitch)} />
                <primitive object={clone(rotPitchMotor)} />

                {/* Joint 2: Shoulder Lift */}
                {/* Position: 0 0.1025 0.0306, BaseRot: -2.86 0 0 */}
                <group position={[0, 0.1025, 0.0306]} rotation={[rad(-2.86 + angles[1]), 0, 0]}>
                    <primitive object={clone(upperArm)} />
                    <primitive object={clone(upperArmMotor)} />

                    {/* Joint 3: Elbow Flex */}
                    {/* Position: 0 0.11257 0.028, BaseRot: 0 0 0 */}
                    <group position={[0, 0.11257, 0.028]} rotation={[rad(angles[2]), 0, 0]}>
                        <primitive object={clone(lowerArm)} />
                        <primitive object={clone(lowerArmMotor)} />

                        {/* Joint 4: Wrist Flex */}
                        {/* Position: 0 0.0052 0.1349, BaseRot: -87.29 0 0 */}
                        <group position={[0, 0.0052, 0.1349]} rotation={[rad(-87.29 + angles[3]), 0, 0]}>
                            <primitive object={clone(wristPR)} />
                            <primitive object={clone(wristPRMotor)} />

                            {/* Joint 5: Wrist Roll */}
                            {/* Position: 0 -0.0601 0, BaseRot: 0 180 0 */}
                            <group position={[0, -0.0601, 0]} rotation={[0, rad(180 + angles[4]), 0]} ref={eeRef}>
                                <primitive object={clone(fixedJaw)} />
                                <primitive object={clone(fixedJawMotor)} />

                                {/* Joint 6: Gripper */}
                                {/* Position: -0.0202 -0.0244 0, BaseRot: 0 180 0 */}
                                <group position={[-0.0202, -0.0244, 0]} rotation={[0, rad(180), rad(angles[5])]}>
                                    <primitive object={clone(movingJaw)} />
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
}
