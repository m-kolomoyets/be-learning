import type { Handler } from '../lib/types.ts';
import { DB_CHECK_TIMEOUT_MS } from '../lib/constants.ts';
import pool from '../lib/db/index.ts';
import { sendResponse } from '../lib/utils/sendResponse.ts';
import { withTimeout } from '../lib/withTimeout.ts';

export const livenessHandler: Handler = (req, res) => {
    sendResponse(res, 200, { status: 'ok', uptime: process.uptime() }, { 'Cache-Control': 'no-store' });
};

export const readinessHandler: Handler = async (req, res) => {
    const start = performance.now();
    let db: { status: 'up' | 'down'; latencyMs?: number };

    try {
        await withTimeout(pool.query('SELECT 1'), DB_CHECK_TIMEOUT_MS);
        db = { status: 'up', latencyMs: Math.round(performance.now() - start) };
    } catch (error) {
        console.error('Health check: DB down', error);
        db = { status: 'down' };
    }

    const healthy = db.status === 'up';

    sendResponse(
        res,
        healthy ? 200 : 503,
        { status: healthy ? 'ok' : 'unavailable', checks: { db } },
        { 'Cache-Control': 'no-store' }
    );
};
