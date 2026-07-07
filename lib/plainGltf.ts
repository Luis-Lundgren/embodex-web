import { useGLTF } from "@react-three/drei";

/** SO-100 GLBs are uncompressed; drei's default draco/meshopt decoders can hang under CSP. */
const PLAIN_GLB = false as const;

export function usePlainGLTF(path: string) {
    return useGLTF(path, PLAIN_GLB, PLAIN_GLB);
}

export function preloadPlainGLTF(path: string) {
    useGLTF.preload(path, PLAIN_GLB, PLAIN_GLB);
}
