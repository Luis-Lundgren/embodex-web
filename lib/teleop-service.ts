import crypto from 'crypto';

/**
 * Server-side teleoperation service layer for Embodex Web.
 * Securely communicates with the Embodex Teleop robot backend.
 * Permanent credentials (EMBODEX_API_TOKEN, EMBODEX_WS_TICKET_SECRET)
 * are NEVER exposed to browser code.
 */

export interface WsTicketPayload {
    sub: string;
    role: string;
    exp: number;
    scope: 'teleop';
    jti: string;
}

export function getTeleopHttpUrl(): string {
    const url = process.env.EMBODEX_TELEOP_HTTP_URL ||
                process.env.NEXT_PUBLIC_EMBODEX_TELEOP_HTTP_URL ||
                'http://localhost:8500';
    return url.replace(/\/$/, '');
}

export function getTeleopWsUrl(): string {
    const url = process.env.NEXT_PUBLIC_EMBODEX_TELEOP_WS_URL ||
                process.env.EMBODEX_TELEOP_WS_URL ||
                'ws://localhost:8500/ws';
    return url;
}

export function getApiToken(): string | undefined {
    return process.env.EMBODEX_API_TOKEN;
}

export function getWsTicketSecret(): string | undefined {
    return process.env.EMBODEX_WS_TICKET_SECRET;
}

/**
 * Generate a short-lived, signed compact JWT ticket for WebSocket authentication.
 * Default lifetime: 60 seconds (within the 30-120s security specification).
 */
export function createWsTicket(
    user: { id: string; roles?: string[] },
    ttlSeconds: number = 60
): string {
    const secret = getWsTicketSecret();
    if (!secret) {
        throw new Error('EMBODEX_WS_TICKET_SECRET is not configured on the web server');
    }

    const roles = user.roles || [];
    let role = 'teleoperator';
    if (roles.includes('admin')) {
        role = 'admin';
    } else if (roles.includes('teleoperator')) {
        role = 'teleoperator';
    } else if (roles.length > 0) {
        role = roles[0];
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: WsTicketPayload = {
        sub: user.id,
        role,
        exp: now + ttlSeconds,
        scope: 'teleop',
        jti: crypto.randomUUID(),
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const hB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const pB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signingInput = `${hB64}.${pB64}`;
    const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');

    return `${signingInput}.${signature}`;
}

/**
 * Proxy an HTTP request to the teleop backend attaching the server-side EMBODEX_API_TOKEN.
 */
export async function proxyTeleopRequest(
    path: string,
    options: {
        method?: string;
        body?: any;
        headers?: Record<string, string>;
    } = {}
): Promise<{ status: number; data: any }> {
    const baseUrl = getTeleopHttpUrl();
    const targetUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(options.headers || {}),
    };

    const token = getApiToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let bodyStr: string | undefined;
    if (options.body !== undefined && options.body !== null) {
        if (typeof options.body === 'string') {
            bodyStr = options.body;
        } else {
            bodyStr = JSON.stringify(options.body);
            if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }
        }
    }

    try {
        const response = await fetch(targetUrl, {
            method: options.method || 'GET',
            headers,
            body: bodyStr,
            cache: 'no-store',
        });

        let data: any;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
        }

        return {
            status: response.status,
            data,
        };
    } catch (error: any) {
        console.error(`[TeleopProxy] Failed to connect to ${targetUrl}:`, error.message);
        return {
            status: 502,
            data: { error: 'Teleop backend unreachable' },
        };
    }
}
