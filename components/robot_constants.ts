
// Map of logical joint names to GLB file names (without extension)
export const ROBOT_ASSETS = {
    base: 'Base',
    base_motor: 'Base_Motor',

    // Joint 1
    shoulder_pan_link: 'Rotation_Pitch',
    shoulder_pan_motor: 'Rotation_Pitch_Motor',

    // Joint 2
    shoulder_lift_link: 'Upper_Arm',
    shoulder_lift_motor: 'Upper_Arm_Motor',

    // Joint 3
    elbow_flex_link: 'Lower_Arm',
    elbow_flex_motor: 'Lower_Arm_Motor',

    // Joint 4
    wrist_flex_link: 'Wrist_Pitch_Roll',
    wrist_flex_motor: 'Wrist_Pitch_Roll_Motor',

    // Joint 5
    wrist_roll_link: 'Fixed_Jaw',
    wrist_roll_motor: 'Fixed_Jaw_Motor',

    // Joint 6 (Gripper)
    gripper_moving: 'Moving_Jaw'
};

export const JOINT_CONFIG = [
    { name: 'shoulder_pan', axis: 'y', invert: true }, // J1: 0 -1 0
    { name: 'shoulder_lift', axis: 'x', invert: false }, // J2: 1 0 0
    { name: 'elbow_flex', axis: 'x', invert: false }, // J3: 1 0 0
    { name: 'wrist_flex', axis: 'x', invert: false }, // J4: 1 0 0
    { name: 'wrist_roll', axis: 'y', invert: false }, // J5: 0 1 0
    { name: 'gripper', axis: 'z', invert: false }     // J6: 0 0 1
];
