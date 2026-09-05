import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { ZEFIX_BASE_URL } from '../nodes/ZefixShab/helpers/constants';

export class ZefixApi implements ICredentialType {
	name = 'zefixApi';

	displayName = 'Zefix API';

	icon: Icon = 'file:zefixShab.svg';

	documentationUrl = 'https://prospex.ch/guides/zefix-rest-api/';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
			description:
				'The Zefix PublicREST username. Accounts are issued by the Federal Office of Justice: write to zefix@bj.admin.ch.',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The password issued with the username',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{ $credentials.username }}',
				password: '={{ $credentials.password }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: ZEFIX_BASE_URL,
			url: '/legalForm',
			method: 'GET',
		},
	};
}
