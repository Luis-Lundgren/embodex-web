import { Suspense } from "react";
import TeleopContent from "./TeleopContent";
import { TeleopLoading } from "./TeleopLoading";

// Server Component page — Suspense must wrap the client child that calls
// useSearchParams(), per Next.js App Router requirements. Keeping this file
// free of "use client" lets the shell hydrate immediately instead of
// staying on the SSR fallback when the heavy Three.js chunk is still loading.
export default function TeleopPage() {
    return (
        <Suspense fallback={<TeleopLoading />}>
            <TeleopContent />
        </Suspense>
    );
}
