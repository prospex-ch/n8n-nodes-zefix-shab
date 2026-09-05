import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IPollFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

import {
	USER_AGENT,
	ZEFIX_BASE_URL,
	ZEFIX_MAX_ATTEMPTS,
	ZEFIX_MIN_INTERVAL_MS,
	ZEFIX_TIMEOUT_MS,
} from '../helpers/constants';
import { requireUid } from '../helpers/uid';

export type ZefixContext = IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions;

/** A localised label, as Zefix returns it for legal forms and detail links. */
export interface ZefixTranslated {
	de?: string;
	fr?: string;
	it?: string;
	en?: string;
}

export interface ZefixLegalForm {
	id: number;
	uid: string;
	name: ZefixTranslated;
	shortName: ZefixTranslated;
}

export interface ZefixCompany extends IDataObject {
	name: string;
	ehraid: number;
	uid: string;
	chid: string;
	legalSeatId: number;
	legalSeat: string;
	registryOfCommerceId: number;
	legalForm: ZefixLegalForm;
	status: string;
	deletionDate: string | null;
}

/** Shared by every process in this Node worker, which is where the pacing has to live. */
let lastRequestAt = 0;

async function throttle(): Promise<void> {
	const elapsed = Date.now() - lastRequestAt;
	if (lastRequestAt > 0 && elapsed < ZEFIX_MIN_INTERVAL_MS) {
		await sleep(ZEFIX_MIN_INTERVAL_MS - elapsed);
	}
	lastRequestAt = Date.now();
}

function statusOf(error: unknown): number | undefined {
	const candidate = error as { httpCode?: string; statusCode?: number; response?: { status?: number } };
	const raw = candidate?.statusCode ?? candidate?.response?.status ?? Number(candidate?.httpCode);
	return Number.isFinite(raw) ? Number(raw) : undefined;
}

/**
 * One authenticated Zefix call, paced and retried.
 *
 * A 404 comes back as `null`, because it means "no such company" and the
 * caller turns that into an empty item. Every other failure throws, including
 * a run of retries that never succeeded: an outage has to stay
 * distinguishable from a company that is not in the register.
 */
async function request<T>(
	context: ZefixContext,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
): Promise<T | null> {
	let lastError: unknown;

	for (let attempt = 0; attempt < ZEFIX_MAX_ATTEMPTS; attempt++) {
		await throttle();
		try {
			return (await context.helpers.httpRequestWithAuthentication.call(context, 'zefixApi', {
				method,
				url: `${ZEFIX_BASE_URL}${path}`,
				body,
				json: true,
				timeout: ZEFIX_TIMEOUT_MS,
				headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
			})) as T;
		} catch (error) {
			const status = statusOf(error);
			if (status === 404) return null;

			const retryable = status === undefined || status === 429 || status >= 500;
			if (!retryable || attempt + 1 === ZEFIX_MAX_ATTEMPTS) {
				throw new NodeApiError(context.getNode(), error as JsonObject);
			}
			lastError = error;
			await sleep(Math.min(2 ** attempt, 30) * 1000);
		}
	}

	throw new NodeApiError(context.getNode(), lastError as JsonObject);
}

/** Fail early and by name when the node is asked for Zefix without credentials. */
export async function requireZefixCredentials(context: ZefixContext, reason: string): Promise<void> {
	let credentials;
	try {
		credentials = await context.getCredentials('zefixApi');
	} catch {
		credentials = undefined;
	}

	if (!credentials?.username || !credentials?.password) {
		throw new NodeOperationError(
			context.getNode(),
			`${reason} needs Zefix credentials.`,
			{
				description:
					'Request a PublicREST account from zefix@bj.admin.ch, then add it under Credentials. https://prospex.ch/guides/zefix-rest-api/ covers what the account unlocks.',
			},
		);
	}
}

/**
 * Look up one company by UID.
 *
 * `/company/uid/{uid}` wants the compact form and answers with a single-element
 * array. A UID that is not in the register comes back as `200` with an empty
 * array, so an empty array and a 404 both mean the same thing here.
 */
export async function getCompanyByUid(
	context: ZefixContext,
	uid: string,
): Promise<ZefixCompany | null> {
	const parsed = requireUid(uid);
	const result = await request<ZefixCompany[]>(context, 'GET', `/company/uid/${parsed.compact}`);
	if (result === null || result.length === 0) return null;
	return result[0];
}

/** Look up one company by EHRA id. This endpoint answers with a bare object. */
export async function getCompanyByEhraid(
	context: ZefixContext,
	ehraid: number,
): Promise<ZefixCompany | null> {
	const result = await request<ZefixCompany | ZefixCompany[]>(
		context,
		'GET',
		`/company/ehraid/${ehraid}`,
	);
	if (result === null) return null;
	if (Array.isArray(result)) return result.length === 0 ? null : result[0];
	return result;
}

export interface ZefixSearchBody extends IDataObject {
	name: string;
	activeOnly?: boolean;
	legalFormId?: number;
	legalFormUid?: string;
	canton?: string;
	legalSeatId?: number;
	registryOfCommerceId?: number;
}

/**
 * Search by name.
 *
 * `canton`, `legalSeatId` and `registryOfCommerceId` are mutually exclusive in
 * the API, and the endpoint is not paginated, so any limit is applied by the
 * caller.
 */
export async function searchCompanies(
	context: ZefixContext,
	body: ZefixSearchBody,
): Promise<ZefixCompany[]> {
	const scopes = (['canton', 'legalSeatId', 'registryOfCommerceId'] as const).filter(
		(key) => body[key] !== undefined && body[key] !== '' && body[key] !== null,
	);

	if (scopes.length > 1) {
		throw new NodeOperationError(
			context.getNode(),
			`Zefix search accepts one location filter, and ${scopes.join(' and ')} were both set.`,
			{ description: 'Keep Canton, Legal Seat ID or Registry of Commerce ID, and clear the others.' },
		);
	}

	if (body.name.trim().length < 3) {
		throw new NodeOperationError(
			context.getNode(),
			'Zefix search needs a name of at least 3 characters.',
			{ description: 'Use * as a wildcard, for example "Migro*".' },
		);
	}

	const result = await request<ZefixCompany[]>(context, 'POST', '/company/search', body);
	return result ?? [];
}

/** The legal-form list, fetched once per execution and reused. */
const legalFormCache = new WeakMap<object, ZefixLegalForm[]>();

export async function getLegalForms(context: ZefixContext): Promise<ZefixLegalForm[]> {
	const key = context.getNode();
	const cached = legalFormCache.get(key);
	if (cached !== undefined) return cached;

	const result = (await request<ZefixLegalForm[]>(context, 'GET', '/legalForm')) ?? [];
	legalFormCache.set(key, result);
	return result;
}
