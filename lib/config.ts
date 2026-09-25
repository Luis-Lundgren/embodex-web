/**
 * Embodex Teleoperation Service URLs.
 *
 * Preferred environment variables:
 * - NEXT_PUBLIC_EMBODEX_TELEOP_WS_URL
 * - NEXT_PUBLIC_EMBODEX_TELEOP_HTTP_URL
 *
 * Deprecated environment variables (v0.2, planned for removal in a future release):
 * - NEXT_PUBLIC_TELEGRIP_WS_URL
 * - NEXT_PUBLIC_TELEGRIP_HTTP_URL
 */

export const EMBODEX_TELEOP_WS_URL = (() => {
    // 1. Preferred modern variable
    if (process.env.NEXT_PUBLIC_EMBODEX_TELEOP_WS_URL) {
        return process.env.NEXT_PUBLIC_EMBODEX_TELEOP_WS_URL;
    }

    // 2. Deprecated fallback: NEXT_PUBLIC_TELEGRIP_WS_URL (Deprecated in v0.2, planned removal in a future release)
    if (process.env.NEXT_PUBLIC_TELEGRIP_WS_URL) {
        return process.env.NEXT_PUBLIC_TELEGRIP_WS_URL;
    }

    // 3. Fallback for local development
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;

        // Unified Embodex teleop server binds to port 8500 by default
        if (host === 'localhost' || host === '127.0.0.1') {
            return `${protocol}//${host}:8500/ws`;
        }

        return `${protocol}//${host}/ws`;
    }

    return 'ws://localhost:8500/ws';
})();

export const EMBODEX_TELEOP_HTTP_URL = (() => {
    // 1. Preferred modern variable
    if (process.env.NEXT_PUBLIC_EMBODEX_TELEOP_HTTP_URL) {
        return process.env.NEXT_PUBLIC_EMBODEX_TELEOP_HTTP_URL;
    }

    // 2. Deprecated fallback: NEXT_PUBLIC_TELEGRIP_HTTP_URL (Deprecated in v0.2, planned removal in a future release)
    if (process.env.NEXT_PUBLIC_TELEGRIP_HTTP_URL) {
        return process.env.NEXT_PUBLIC_TELEGRIP_HTTP_URL;
    }

    // 3. Fallback logic
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const host = window.location.hostname;

        if (host === 'localhost' || host === '127.0.0.1') {
            return `${protocol}//${host}:8500`;
        }

        return `${protocol}//${host}`;
    }

    return 'http://localhost:8500';
})();

/**
 * @deprecated Deprecated in v0.2. Use EMBODEX_TELEOP_WS_URL instead. Planned removal in a future release.
 */
export const TELEGRIP_WS_URL = EMBODEX_TELEOP_WS_URL;

/**
 * @deprecated Deprecated in v0.2. Use EMBODEX_TELEOP_HTTP_URL instead. Planned removal in a future release.
 */
export const TELEGRIP_HTTP_URL = EMBODEX_TELEOP_HTTP_URL;
