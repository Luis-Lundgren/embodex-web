export const TELEGRIP_WS_URL = (() => {
    if (process.env.NEXT_PUBLIC_TELEGRIP_WS_URL) {
        return process.env.NEXT_PUBLIC_TELEGRIP_WS_URL;
    }

    // Fallback for local development or if env var is missing
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;

        // If we're on localhost, use the local port 8442
        if (host === 'localhost' || host === '127.0.0.1') {
            return `${protocol}//${host}:8442`;
        }

        // Default fallback for other domains if no env var is set
        return `${protocol}//${host}/ws`;
    }

    return 'ws://localhost:8442';
})();

export const TELEGRIP_HTTP_URL = (() => {
    if (process.env.NEXT_PUBLIC_TELEGRIP_HTTP_URL) {
        return process.env.NEXT_PUBLIC_TELEGRIP_HTTP_URL;
    }

    // Fallback logic
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const host = window.location.hostname;

        // Localhost fallback
        if (host === 'localhost' || host === '127.0.0.1') {
            // Traditionally local HTTP might be 8442 or 8443. 
            // Using 8442 to match the WS port suggested by user for local.
            return `${protocol}//${host}:8442`;
        }

        return `${protocol}//${host}`;
    }

    return 'http://localhost:8442';
})();
