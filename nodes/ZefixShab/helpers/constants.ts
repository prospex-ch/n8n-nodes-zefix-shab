/** Shared constants: hosts, pacing, and the fixed option lists. */

import { version } from '../../../package.json';

export const ZEFIX_BASE_URL = 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1';

/** The canonical Amtsblattportal host. `www.shab.ch/api/v1` mirrors it. */
export const SHAB_BASE_URL = 'https://amtsblattportal.ch/api/v1';

export const ZEFIX_MIN_INTERVAL_MS = 500;
export const ZEFIX_MAX_ATTEMPTS = 3;
export const ZEFIX_TIMEOUT_MS = 30_000;

export const SHAB_MIN_INTERVAL_MS = 1_000;
export const SHAB_MAX_ATTEMPTS = 4;
export const SHAB_TIMEOUT_MS = 30_000;
export const SHAB_MAX_PAGE_SIZE = 2_000;

/** The 26 cantons, keyed by the two-letter code the registers publish. */
export const CANTONS: Array<{ name: string; value: string }> = [
	{ name: 'Aargau', value: 'AG' },
	{ name: 'Appenzell Ausserrhoden', value: 'AR' },
	{ name: 'Appenzell Innerrhoden', value: 'AI' },
	{ name: 'Basel-Landschaft', value: 'BL' },
	{ name: 'Basel-Stadt', value: 'BS' },
	{ name: 'Bern', value: 'BE' },
	{ name: 'Fribourg', value: 'FR' },
	{ name: 'Geneva', value: 'GE' },
	{ name: 'Glarus', value: 'GL' },
	{ name: 'Graubünden', value: 'GR' },
	{ name: 'Jura', value: 'JU' },
	{ name: 'Lucerne', value: 'LU' },
	{ name: 'Neuchâtel', value: 'NE' },
	{ name: 'Nidwalden', value: 'NW' },
	{ name: 'Obwalden', value: 'OW' },
	{ name: 'Schaffhausen', value: 'SH' },
	{ name: 'Schwyz', value: 'SZ' },
	{ name: 'Solothurn', value: 'SO' },
	{ name: 'St. Gallen', value: 'SG' },
	{ name: 'Thurgau', value: 'TG' },
	{ name: 'Ticino', value: 'TI' },
	{ name: 'Uri', value: 'UR' },
	{ name: 'Valais', value: 'VS' },
	{ name: 'Vaud', value: 'VD' },
	{ name: 'Zug', value: 'ZG' },
	{ name: 'Zürich', value: 'ZH' },
];

/** The three commercial-register sub-rubrics. */
export const SUB_RUBRICS: Array<{ name: string; value: string; description: string }> = [
	{ name: 'HR01 New Registrations', value: 'HR01', description: 'A company entered the register' },
	{ name: 'HR02 Mutations', value: 'HR02', description: 'An existing entry changed' },
	{ name: 'HR03 Deletions', value: 'HR03', description: 'A company left the register' },
];

export const LANGUAGES: Array<{ name: string; value: string }> = [
	{ name: 'German', value: 'de' },
	{ name: 'French', value: 'fr' },
	{ name: 'Italian', value: 'it' },
];

/** Sent on every request so an operator reading their logs knows who to contact. */
export const USER_AGENT = `n8n-nodes-zefix-shab/${version} (+https://github.com/prospex-ch/n8n-nodes-zefix-shab)`;
