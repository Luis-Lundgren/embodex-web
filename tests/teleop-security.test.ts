import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

// Setup environment before importing handlers
process.env.EMBODEX_API_TOKEN = 'test-server-api-token-987';
process.env.EMBODEX_WS_TICKET_SECRET = 'test-ws-ticket-secret-654321';
process.env.NEXT_PUBLIC_EMBODEX_TELEOP_WS_URL = 'ws://localhost:8500/ws';

import { createWsTicket, proxyTeleopRequest } from '../lib/teleop-service';
import { authService } from '../lib/auth';
import { POST as handleWsTicket } from '../app/api/teleop/ws-ticket/route';
import { GET as handleControlGet, POST as handleControlPost } from '../app/api/teleop/control/[action]/route';
import { GET as handleSessionsGet } from '../app/api/teleop/sessions/route';

describe('Embodex Web Security & Integration Tests', () => {
    let mockBackendServer: http.Server;
    let mockBackendPort: number;
    let lastBackendRequest: {
        method?: string;
        url?: string;
        headers?: http.IncomingHttpHeaders;
        body?: string;
    } = {};

    before(async () => {
        // Spin up a mock teleop backend HTTP server
        mockBackendServer = http.createServer((req, res) => {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                lastBackendRequest = {
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body,
                };

                if (req.url === '/api/robot') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, action: 'connect' }));
                } else if (req.url === '/api/status') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ running: true, robotEngaged: true }));
                } else if (req.url === '/api/restart') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Restarting system' }));
                } else if (req.url === '/api/config') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ host_ip: '127.0.0.1', port: 8500 }));
                } else if (req.url === '/api/sessions') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify([{ id: 'sess_1', createdAt: '2026-09-25T12:00:00Z' }]));
                } else if (req.url?.startsWith('/api/sessions/')) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: 'sess_1', joint_positions: [[0, 0, 0]] }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
            });
        });

        await new Promise<void>((resolve) => {
            mockBackendServer.listen(0, '127.0.0.1', () => {
                const addr = mockBackendServer.address() as any;
                mockBackendPort = addr.port;
                process.env.EMBODEX_TELEOP_HTTP_URL = `http://127.0.0.1:${mockBackendPort}`;
                resolve();
            });
        });
    });

    after(() => {
        mockBackendServer.close();
    });

    // ------------------------------------------------------------------------
    // Ticket Creation & Verification
    // ------------------------------------------------------------------------
    it('ws-ticket: generates a valid 3-part compact JWT with correct scope and quick expiry', () => {
        const ticket = createWsTicket({ id: 'user_operator_1', roles: ['teleoperator'] }, 60);
        const parts = ticket.split('.');
        assert.equal(parts.length, 3, 'Ticket must be a 3-part compact JWT');

        const [hB64, pB64, sigB64] = parts;
        const header = JSON.parse(Buffer.from(hB64, 'base64url').toString('utf8'));
        const payload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf8'));

        assert.equal(header.alg, 'HS256');
        assert.equal(payload.sub, 'user_operator_1');
        assert.equal(payload.role, 'teleoperator');
        assert.equal(payload.scope, 'teleop');
        assert.ok(payload.jti, 'Ticket must contain unique jti');

        const now = Math.floor(Date.now() / 1000);
        const remaining = payload.exp - now;
        assert.ok(remaining >= 55 && remaining <= 65, `Expiry should be ~60s, got ${remaining}s`);

        // Verify cryptographic HMAC signature
        const expectedSig = crypto
            .createHmac('sha256', process.env.EMBODEX_WS_TICKET_SECRET!)
            .update(`${hB64}.${pB64}`)
            .digest('base64url');
        assert.equal(sigB64, expectedSig, 'Signature must match HMAC-SHA256');
    });

    // ------------------------------------------------------------------------
    // ws-ticket route
    // ------------------------------------------------------------------------
    it('ws-ticket route: unauthenticated request -> 401', async () => {
        mock.method(authService, 'getSession', async () => null);

        const res = await handleWsTicket();
        assert.equal(res.status, 401);
        const json = await res.json();
        assert.ok(json.error.includes('Authentication required'));
    });

    it('ws-ticket route: teleoperator user -> 200 with ticket and wsUrl', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'user_42', roles: ['teleoperator'] },
        }));

        const res = await handleWsTicket();
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.ok(json.ticket, 'Should return signed ticket');
        assert.equal(json.expiresIn, 60);
        assert.ok(json.wsUrl.includes('8500'));
    });

    it('ws-ticket route: lab-only user -> 403 Forbidden', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'user_lab_only', roles: ['lab'] },
        }));

        const res = await handleWsTicket();
        assert.equal(res.status, 403);
        const json = await res.json();
        assert.ok(json.error.includes('Forbidden'));
    });

    // ------------------------------------------------------------------------
    // Control proxy routes & RBAC
    // ------------------------------------------------------------------------
    it('control proxy: unauthenticated request -> 401', async () => {
        mock.method(authService, 'getSession', async () => null);

        const req = new Request('http://localhost:3000/api/teleop/control/robot', {
            method: 'POST',
            body: JSON.stringify({ action: 'connect' }),
        });
        const res = await handleControlPost(req, { params: { action: 'robot' } });
        assert.equal(res.status, 401);
    });

    it('control proxy: unauthorized role (lab) attempting robot control -> 403', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'lab_user_1', roles: ['lab'] },
        }));

        const req = new Request('http://localhost:3000/api/teleop/control/robot', {
            method: 'POST',
            body: JSON.stringify({ action: 'connect' }),
        });
        const res = await handleControlPost(req, { params: { action: 'robot' } });
        assert.equal(res.status, 403);
    });

    it('control proxy: authorized teleoperator -> attaches Bearer token server-side', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'teleop_user_1', roles: ['teleoperator'] },
        }));

        const req = new Request('http://localhost:3000/api/teleop/control/robot', {
            method: 'POST',
            body: JSON.stringify({ action: 'connect' }),
        });
        const res = await handleControlPost(req, { params: { action: 'robot' } });
        assert.equal(res.status, 200);

        // Verify that the teleop backend received the server-side bearer token
        assert.equal(
            lastBackendRequest.headers?.['authorization'],
            `Bearer ${process.env.EMBODEX_API_TOKEN}`
        );

        // Verify that response to browser does NOT leak EMBODEX_API_TOKEN
        const json = await res.json();
        assert.equal(json.success, true);
        const serialized = JSON.stringify(json);
        assert.ok(!serialized.includes(process.env.EMBODEX_API_TOKEN!));
    });

    it('control proxy: non-admin attempting restart -> 403', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'teleop_user_2', roles: ['teleoperator'] },
        }));

        const req = new Request('http://localhost:3000/api/teleop/control/restart', {
            method: 'POST',
        });
        const res = await handleControlPost(req, { params: { action: 'restart' } });
        assert.equal(res.status, 403);
    });

    it('control proxy: admin attempting restart -> 200', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'admin_user_1', roles: ['admin'] },
        }));

        const req = new Request('http://localhost:3000/api/teleop/control/restart', {
            method: 'POST',
        });
        const res = await handleControlPost(req, { params: { action: 'restart' } });
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
    });

    it('control proxy: non-admin attempting POST config -> 403', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'teleop_user_3', roles: ['teleoperator'] },
        }));

        const req = new Request('http://localhost:3000/api/teleop/control/config', {
            method: 'POST',
            body: JSON.stringify({ log_level: 'debug' }),
        });
        const res = await handleControlPost(req, { params: { action: 'config' } });
        assert.equal(res.status, 403);
    });

    // ------------------------------------------------------------------------
    // Session Data Proxy
    // ------------------------------------------------------------------------
    it('sessions proxy: unauthenticated request with sessionId -> 401', async () => {
        mock.method(authService, 'getSession', async () => null);

        const req = new Request('http://localhost:3000/api/teleop/sessions?sessionId=sess_1');
        const res = await handleSessionsGet(req);
        assert.equal(res.status, 401);
        const json = await res.json();
        assert.ok(json.error.includes('Authentication required'));
    });

    it('sessions proxy: authenticated request with sessionId -> succeeds with trajectory data', async () => {
        mock.method(authService, 'getSession', async () => ({
            user: { id: 'teleop_user_4', roles: ['teleoperator'] },
        }));

        const req = new Request('http://localhost:3000/api/teleop/sessions?sessionId=sess_1');
        const res = await handleSessionsGet(req);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.id, 'sess_1');
        assert.ok(Array.isArray(json.joint_positions));
        assert.equal(
            lastBackendRequest.headers?.['authorization'],
            `Bearer ${process.env.EMBODEX_API_TOKEN}`
        );
    });

    it('sessions proxy: listing sessions does not expose record_dir', async () => {
        const req = new Request('http://localhost:3000/api/teleop/sessions');
        const res = await handleSessionsGet(req);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.ok(Array.isArray(json));
        assert.equal(json[0].id, 'sess_1');
        assert.equal(json[0].record_dir, undefined);
    });
});
