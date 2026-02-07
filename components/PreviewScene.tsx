import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stage, Environment } from '@react-three/drei';
import { RobotModel } from './RobotModel';

interface PreviewSceneProps {
    jointPositions: number[][];
    fps: number;
}

function PreviewRobot({ jointPositions, fps }: PreviewSceneProps) {
    const frameRef = useRef(0);
    const accumulatorRef = useRef(0);

    const currentJoints = useMemo(() => {
        if (!jointPositions || jointPositions.length === 0) return () => [0, 0, 0, 0, 0, 0];
        return (frame: number) => jointPositions[frame % jointPositions.length] || [0, 0, 0, 0, 0, 0];
    }, [jointPositions]);

    const [joints, setJoints] = React.useState<number[]>((jointPositions && jointPositions[0]) || [0, 0, 0, 0, 0, 0]);

    useFrame((_state: any, delta: number) => {
        if (!jointPositions || jointPositions.length === 0) return;
        accumulatorRef.current += delta;
        const msPerFrame = 1 / fps;

        if (accumulatorRef.current >= msPerFrame) {
            frameRef.current = (frameRef.current + 1) % jointPositions.length;
            setJoints(currentJoints(frameRef.current));
            accumulatorRef.current %= msPerFrame;
        }
    });

    return <RobotModel jointPositions={joints} />;
}

export default function PreviewScene({ jointPositions, fps }: PreviewSceneProps) {
    return (
        <div className="w-full h-full bg-black">
            <Canvas camera={{ position: [0.4, 0.4, 0.4], fov: 40 }} shadows>
                <ambientLight intensity={0.5} />
                <pointLight position={[1, 1, 1]} intensity={1} />
                <Stage environment="city" intensity={0.5} {...({ contactShadow: { opacity: 0.4, blur: 2 } } as any)} adjustCamera={false}>
                    <PreviewRobot jointPositions={jointPositions} fps={fps} />
                </Stage>
                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
