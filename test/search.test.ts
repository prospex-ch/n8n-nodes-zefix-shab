/* Tests run under `node --test` and never ship: `files` in package.json is `dist` only. */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { searchCompanies } from '../dist/nodes/ZefixShab/transport/zefix.js';

/** Enough of an execution context for the transport to run against. */
function context(reply: unknown = []) {
	const calls: unknown[] = [];
	return {
		calls,
		getNode: () => ({ name: 'Zefix/SHAB', type: 'zefixShab', typeVersion: 1 }),
		helpers: {
			httpRequestWithAuthentication: {
				call: async (_self: unknown, _credential: string, options: unknown) => {
					calls.push(options);
					return reply;
				},
			},
		},
	};
}

describe('searchCompanies', () => {
	it('refuses two location filters, before any request goes out', async () => {
		const ctx = context();
		await assert.rejects(
			// @ts-expect-error the fake carries only what the transport touches
			searchCompanies(ctx, { name: 'Migros', canton: 'ZH', legalSeatId: 261 }),
			/canton and legalSeatId/,
		);
		assert.equal(ctx.calls.length, 0);
	});

	it('accepts one location filter', async () => {
		const ctx = context();
		// @ts-expect-error the fake carries only what the transport touches
		await searchCompanies(ctx, { name: 'Migros', canton: 'ZH' });
		assert.equal(ctx.calls.length, 1);
	});

	it('refuses a name shorter than the API minimum', async () => {
		const ctx = context();
		// @ts-expect-error the fake carries only what the transport touches
		await assert.rejects(searchCompanies(ctx, { name: 'AG' }), /at least 3 characters/);
		assert.equal(ctx.calls.length, 0);
	});
});
