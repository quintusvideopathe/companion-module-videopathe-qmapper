import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	pollInterval: number
	animate: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'QMapper HTTP API',
			value:
				'Point this module at the Android device running QMapper. The web server listens on port 2226 by default. Open QMapper → API Documentation (in the web interface) to explore the endpoints.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'QMapper host / IP',
			width: 8,
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'port',
			label: 'Port',
			width: 4,
			default: 2226,
			min: 1,
			max: 65535,
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll interval (ms) — lower = smoother progress bar',
			width: 6,
			default: 400,
			min: 150,
			max: 10000,
		},
		{
			type: 'checkbox',
			id: 'animate',
			label: 'Animate progress bar & blackout button',
			width: 6,
			default: true,
		},
	]
}
