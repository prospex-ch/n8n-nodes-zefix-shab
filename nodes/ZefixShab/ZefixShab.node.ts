import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { companyFields, companyOperations } from './descriptions/CompanyDescription';
import { publicationFields, publicationOperations } from './descriptions/PublicationDescription';
import type { EventType } from './helpers/events';
import { toRow } from './helpers/publication';
import { parseUid, requireUid, sameUid } from './helpers/uid';
import { fetchPublications } from './transport/shab';
import type { ShabQuery } from './transport/shab';
import {
	getCompanyByEhraid,
	getCompanyByUid,
	getLegalForms,
	requireZefixCredentials,
	searchCompanies,
} from './transport/zefix';
import type { ZefixCompany, ZefixSearchBody } from './transport/zefix';

/** A date parameter as SHAB wants it: a bare day. */
function asDay(value: string | undefined, fallback?: string): string | undefined {
	if (!value) return fallback;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return fallback;
	return parsed.toISOString().slice(0, 10);
}

/** The Lookup output. `purpose` and `sogcPub` ride along untouched. */
function companyRow(company: ZefixCompany): IDataObject {
	// Zefix stores the compact form and Publications emit the dotted one. Both
	// operations emit the dotted form so a workflow can join them.
	const uid = parseUid(company.uid ?? '');

	return {
		name: company.name,
		uid: uid?.dotted ?? company.uid,
		uidCompact: uid?.compact ?? company.uid,
		ehraid: company.ehraid,
		chid: company.chid,
		canton: company.canton ?? null,
		legalSeat: company.legalSeat,
		legalSeatId: company.legalSeatId,
		legalFormId: company.legalForm?.id ?? null,
		legalFormUid: company.legalForm?.uid ?? null,
		legalForm: company.legalForm ?? null,
		status: company.status,
		purpose: company.purpose ?? null,
		capitalNominal: company.capitalNominal ?? null,
		capitalCurrency: company.capitalCurrency ?? null,
		deletionDate: company.deletionDate,
		sogcDate: company.sogcDate ?? null,
		address: company.address ?? null,
		translation: company.translation ?? [],
		oldNames: company.oldNames ?? [],
		headOffices: company.headOffices ?? [],
		furtherHeadOffices: company.furtherHeadOffices ?? [],
		branchOffices: company.branchOffices ?? [],
		hasTakenOver: company.hasTakenOver ?? [],
		wasTakenOverBy: company.wasTakenOverBy ?? [],
		auditCompanies: company.auditCompanies ?? [],
		registryOfCommerceId: company.registryOfCommerceId,
		cantonalExcerptWeb: company.cantonalExcerptWeb ?? null,
		zefixDetailWeb: company.zefixDetailWeb ?? null,
	};
}

export class ZefixShab implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zefix and SHAB',
		name: 'zefixShab',
		icon: 'file:zefixShab.svg',
		group: ['input'],
		version: [1],
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Read the Swiss commercial register and its official gazette',
		defaults: { name: 'Zefix and SHAB' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'zefixApi',
				// Publications and the trigger read SHAB, which is open. Lookup
				// and Search ask for the credential by name when it is missing.
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Company', value: 'company' },
					{ name: 'Publication', value: 'publication' },
				],
				default: 'company',
			},
			...companyOperations,
			...companyFields,
			...publicationOperations,
			...publicationFields,
		],
	};

	methods = {
		loadOptions: {
			async getLegalForms(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				await requireZefixCredentials(this, 'The legal-form list');
				const forms = await getLegalForms(this);
				return forms
					.filter((form) => form.id !== 0)
					.map((form) => ({
						name: form.name?.en ?? form.name?.de ?? form.uid,
						value: form.id,
					}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returned: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'company' && operation === 'lookup') {
					await requireZefixCredentials(this, 'Company lookup');

					const lookupBy = this.getNodeParameter('lookupBy', i) as string;
					const company =
						lookupBy === 'uid'
							? await getCompanyByUid(this, this.getNodeParameter('uid', i) as string)
							: await getCompanyByEhraid(this, this.getNodeParameter('ehraid', i) as number);

					// No such company. An outage throws instead, from the transport.
					returned.push({ json: company === null ? {} : companyRow(company), pairedItem: i });
					continue;
				}

				if (resource === 'company' && operation === 'search') {
					await requireZefixCredentials(this, 'Company search');

					const options = this.getNodeParameter('searchOptions', i, {}) as IDataObject;
					const limit = this.getNodeParameter('limit', i) as number;

					const body: ZefixSearchBody = { name: this.getNodeParameter('name', i) as string };
					if (options.activeOnly !== undefined) body.activeOnly = options.activeOnly as boolean;
					if (options.canton) body.canton = options.canton as string;
					if (options.legalFormId) body.legalFormId = Number(options.legalFormId);
					if (options.legalSeatId) body.legalSeatId = Number(options.legalSeatId);
					if (options.registryOfCommerceId) {
						body.registryOfCommerceId = Number(options.registryOfCommerceId);
					}

					// The endpoint is not paginated, so the limit is applied here.
					const results = await searchCompanies(this, body);
					for (const company of results.slice(0, limit)) {
						const uid = parseUid(company.uid ?? '');
						returned.push({
							json: {
								...(company as IDataObject),
								uid: uid?.dotted ?? company.uid,
								uidCompact: uid?.compact ?? company.uid,
							},
							pairedItem: i,
						});
					}
					continue;
				}

				if (resource === 'publication' && operation === 'getAll') {
					const rows = await publications.call(this, i);
					for (const row of rows) returned.push({ json: row, pairedItem: i });
					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					`Unknown operation "${operation}" on resource "${resource}"`,
					{ itemIndex: i },
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returned.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				if (error.context) {
					error.context.itemIndex = i;
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returned];
	}
}

/** Publication → Get Many, split out because it carries the whole filter stack. */
async function publications(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	const filterBy = this.getNodeParameter('filterBy', i) as string;
	const limit = this.getNodeParameter('limit', i) as number;
	const options = this.getNodeParameter('publicationOptions', i, {}) as IDataObject;

	const query: ShabQuery = {
		dateStart: asDay(this.getNodeParameter('startDate', i) as string),
		dateEnd: asDay(this.getNodeParameter('endDate', i, '') as string, new Date().toISOString().slice(0, 10)),
		includeCancelled: options.includeCancelled === true,
		includeContent: true,
		language: (options.language as string) || undefined,
	};

	// SHAB indexes company names and not UIDs, so a UID filter is a name
	// search resolved through Zefix, then a UID match on the rows that
	// come back.
	let uidFilter: string | null = null;
	if (filterBy === 'uid') {
		await requireZefixCredentials(this, 'Filtering publications by UID');
		const uid = requireUid(this.getNodeParameter('uid', i) as string);
		const company = await getCompanyByUid(this, uid.compact);
		if (company === null) return [];
		query.keyword = company.name;
		uidFilter = uid.dotted;
	} else if (filterBy === 'name') {
		query.keyword = this.getNodeParameter('companyName', i) as string;
	}

	const cantons = new Set((options.cantons as string[]) ?? []);
	const subRubrics = new Set((options.subRubrics as string[]) ?? []);
	const eventTypes = new Set((options.eventTypes as EventType[]) ?? []);
	const includeRawContent = options.includeRawContent === true;

	// Every filter below runs on rows the API already sent, so the limit can
	// only stop the paging when none of them is set.
	const filtersLocally =
		uidFilter !== null || cantons.size > 0 || subRubrics.size > 0 || eventTypes.size > 0;
	if (!filtersLocally) query.limit = limit;

	const publicationList = await fetchPublications(this, query);
	const rows: IDataObject[] = [];

	for (const publication of publicationList) {
		// `subRubrics` and `cantons` are accepted by the API and ignored by it.
		if (subRubrics.size > 0 && !subRubrics.has(publication.meta.subRubric)) continue;
		if (cantons.size > 0 && !(publication.meta.cantons ?? []).some((c) => cantons.has(c))) continue;

		const row = toRow(publication, includeRawContent);
		if (uidFilter !== null && !sameUid(row.uid, uidFilter)) continue;
		if (eventTypes.size > 0 && !row.eventTypes.some((type) => eventTypes.has(type as EventType))) {
			continue;
		}

		rows.push(row);
		if (rows.length >= limit) break;
	}

	return rows;
}
