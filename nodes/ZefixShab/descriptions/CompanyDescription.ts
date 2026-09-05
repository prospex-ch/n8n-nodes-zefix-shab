import type { INodeProperties } from 'n8n-workflow';

import { CANTONS } from '../helpers/constants';

export const companyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['company'] } },
		options: [
			{
				name: 'Lookup',
				value: 'lookup',
				description: 'Read one company by UID or EHRA ID',
				action: 'Look up a company',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Find companies by name',
				action: 'Search companies',
			},
		],
		default: 'lookup',
	},
];

export const companyFields: INodeProperties[] = [
	{
		displayName: 'Look Up By',
		name: 'lookupBy',
		type: 'options',
		displayOptions: { show: { resource: ['company'], operation: ['lookup'] } },
		options: [
			{ name: 'UID', value: 'uid' },
			{ name: 'EHRA ID', value: 'ehraid' },
		],
		default: 'uid',
		description: 'Which identifier the company is read by',
	},
	{
		displayName: 'UID',
		name: 'uid',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['company'], operation: ['lookup'], lookupBy: ['uid'] } },
		default: '',
		placeholder: 'CHE-123.456.789',
		description: 'CHE-123.456.789, CHE123456789 and 123456789 are all accepted',
	},
	{
		displayName: 'EHRA ID',
		name: 'ehraid',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['company'], operation: ['lookup'], lookupBy: ['ehraid'] } },
		default: 0,
		description: 'The internal register ID Zefix returns alongside every company',
	},

	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['company'], operation: ['search'] } },
		default: '',
		placeholder: 'Migro*',
		description: 'At least 3 characters. * matches any sequence.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['company'], operation: ['search'] } },
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add option',
		displayOptions: { show: { resource: ['company'], operation: ['search'] } },
		default: {},
		options: [
			{
				displayName: 'Active Only',
				name: 'activeOnly',
				type: 'boolean',
				default: true,
				description: 'Whether to drop companies that have been struck from the register',
			},
			{
				displayName: 'Canton',
				name: 'canton',
				type: 'options',
				options: CANTONS,
				default: '',
				description:
					'Restrict to one canton. Canton, Legal Seat ID and Registry of Commerce ID are mutually exclusive.',
			},
			{
				displayName: 'Legal Form Name or ID',
				name: 'legalFormId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getLegalForms' },
				default: '',
				description:
					'Restrict to one legal form. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Legal Seat ID',
				name: 'legalSeatId',
				type: 'number',
				default: 0,
				description:
					'Restrict to one commune, by its Zefix seat ID. Mutually exclusive with Canton and Registry of Commerce ID.',
			},
			{
				displayName: 'Registry of Commerce ID',
				name: 'registryOfCommerceId',
				type: 'number',
				default: 0,
				description:
					'Restrict to one cantonal registry office. Mutually exclusive with Canton and Legal Seat ID.',
			},
		],
	},
];
