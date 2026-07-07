import type { CompanionActionDefinition, DropdownChoice } from '@companion-module/base'
import {
	DISCONNECT_INPUT_CHOICES,
	LANGUAGE_CHOICES,
	MQTT_STATE_CHOICES,
	REPEAT_MODE_CHOICES,
	SOURCE_MODE_CHOICES,
	STATE_CHOICES,
	SYNC_MODE_CHOICES,
	TRANSITION_CHOICES,
} from './choices.js'
import type { ModuleInstance } from './main.js'

function resolveToggle(state: string, current: boolean | undefined): boolean {
	if (state === 'on') return true
	if (state === 'off') return false
	return !(current === true)
}

export function UpdateActions(self: ModuleInstance): void {
	// Layer-name choices are rebuilt whenever QMapper's warp layer set changes.
	const layerNames: DropdownChoice[] = self.getLayerNames().map((name) => ({ id: name, label: name }))

	const actions: Record<string, CompanionActionDefinition> = {
		refresh_state: {
			name: 'General: Refresh state now',
			options: [],
			callback: async () => {
				await self.refreshState()
			},
		},

		// ---- Playlist transport ----
		playlist_play: {
			name: 'Playlist: Play',
			options: [],
			callback: async () => self.postCmd('/api/playlist/play'),
		},
		playlist_pause: {
			name: 'Playlist: Pause',
			options: [],
			callback: async () => self.postCmd('/api/playlist/pause'),
		},
		playlist_stop: {
			name: 'Playlist: Stop',
			options: [],
			callback: async () => self.postCmd('/api/playlist/stop'),
		},
		playlist_next: {
			name: 'Playlist: Next',
			options: [],
			callback: async () => self.postCmd('/api/playlist/next'),
		},
		playlist_prev: {
			name: 'Playlist: Previous',
			options: [],
			callback: async () => self.postCmd('/api/playlist/prev'),
		},
		playlist_play_index: {
			name: 'Playlist: Play item at index',
			options: [{ id: 'index', type: 'number', label: 'Index (0-based)', default: 0, min: 0, max: 9999 }],
			callback: async (event) => self.postCmd(`/api/playlist/play/${Number(event.options.index)}`),
		},
		playlist_toggle_index: {
			name: 'Playlist: Toggle item enabled at index',
			options: [{ id: 'index', type: 'number', label: 'Index (0-based)', default: 0, min: 0, max: 9999 }],
			callback: async (event) => self.postCmd(`/api/playlist/toggle/${Number(event.options.index)}`),
		},
		playlist_reload: {
			name: 'Playlist: Reload',
			options: [],
			callback: async () => self.postCmd('/api/playlist/reload'),
		},
		playlist_settings: {
			name: 'Playlist: Settings',
			options: [
				{ id: 'repeatMode', type: 'dropdown', label: 'Repeat mode', default: 0, choices: REPEAT_MODE_CHOICES },
				{ id: 'autoRestart', type: 'checkbox', label: 'Auto restart', default: false },
				{ id: 'transition', type: 'dropdown', label: 'Source transition', default: 'fade', choices: TRANSITION_CHOICES },
				{ id: 'fadeMs', type: 'number', label: 'Transition duration (ms)', default: 800, min: 0, max: 60000 },
			],
			callback: async (event) =>
				self.postCmd('/api/playlist/settings', {
					repeatMode: Number(event.options.repeatMode),
					autoRestart: Boolean(event.options.autoRestart),
					sourceTransitionMode: String(event.options.transition),
					sourceTransitionDurationMs: Number(event.options.fadeMs),
				}),
		},

		// ---- Source switch (all sources go through /api/control/source-switch) ----
		source_switch: {
			name: 'Source: Switch active source',
			options: [
				{ id: 'sourceMode', type: 'dropdown', label: 'Source', default: 'playlist', choices: SOURCE_MODE_CHOICES },
				{ id: 'transition', type: 'dropdown', label: 'Transition', default: 'fade', choices: TRANSITION_CHOICES },
				{ id: 'fadeMs', type: 'number', label: 'Fade duration (ms)', default: 800, min: 0, max: 60000 },
				{
					id: 'usbDeviceKey',
					type: 'textinput',
					label: 'USB device key (optional — blank opens the default device)',
					default: '',
					isVisible: (options) => options.sourceMode === 'usb',
				},
			],
			callback: async (event) => {
				const mode = String(event.options.sourceMode)
				const body: Record<string, unknown> = {
					sourceMode: mode,
					transitionMode: String(event.options.transition),
					fadeDurationMs: Number(event.options.fadeMs),
				}
				if (mode === 'usb') {
					const key = String(event.options.usbDeviceKey ?? '').trim()
					if (key) body.deviceKey = key
				}
				return self.postCmd('/api/control/source-switch', body)
			},
		},
		source_disconnect: {
			name: 'Source: Disconnect a network input',
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 'rtsp', choices: DISCONNECT_INPUT_CHOICES }],
			callback: async (event) => self.postCmd(`/api/${String(event.options.input)}-input/disconnect`),
		},

		// ---- Blackout ----
		blackout: {
			name: 'Output: Blackout',
			options: [{ id: 'state', type: 'dropdown', label: 'Action', default: 'toggle', choices: STATE_CHOICES }],
			callback: async (event) => {
				const state = String(event.options.state)
				// A body-less POST toggles server-side; explicit on/off sets it.
				if (state === 'toggle') return self.postCmd('/api/blackout')
				return self.postCmd('/api/blackout', { enabled: state === 'on' })
			},
		},

		// ---- Warp / mapping ----
		warp_grid: {
			name: 'Warp: Show mapping grid',
			options: [{ id: 'state', type: 'dropdown', label: 'Action', default: 'toggle', choices: STATE_CHOICES }],
			callback: async (event) =>
				self.postCmd('/api/warp/show-grid', {
					enabled: resolveToggle(String(event.options.state), self.status?.warp?.gridVisible),
				}),
		},
		warp_visibility_main: {
			name: 'Warp: Main output visibility',
			options: [{ id: 'state', type: 'dropdown', label: 'Visibility', default: 'toggle', choices: STATE_CHOICES }],
			callback: async (event) => {
				const state = String(event.options.state)
				// A body-less POST toggles server-side; explicit on/off sets it.
				if (state === 'toggle') return self.postCmd('/api/warp/visibility/main')
				return self.postCmd('/api/warp/visibility/main', { visible: state === 'on' })
			},
		},
		warp_visibility_layer: {
			name: 'Warp: Layer visibility',
			options: [
				{
					id: 'name',
					type: 'dropdown',
					label: 'Layer',
					default: layerNames[0]?.id ?? '',
					choices: layerNames,
					allowCustom: true,
				},
				{ id: 'state', type: 'dropdown', label: 'Visibility', default: 'toggle', choices: STATE_CHOICES },
			],
			callback: async (event) => {
				const name = String(event.options.name)
				const state = String(event.options.state)
				// Omitting `visible` toggles server-side.
				if (state === 'toggle') return self.postCmd('/api/warp/visibility/layer', { name })
				return self.postCmd('/api/warp/visibility/layer', { name, visible: state === 'on' })
			},
		},
		warp_color: {
			name: 'Warp: Colour correction',
			options: [
				{ id: 'brightness', type: 'number', label: 'Brightness (-1 to 1)', default: 0, min: -1, max: 1, step: 0.05 },
				{ id: 'contrast', type: 'number', label: 'Contrast (0 to 2)', default: 1, min: 0, max: 2, step: 0.05 },
				{ id: 'red', type: 'number', label: 'Red (0 to 2)', default: 1, min: 0, max: 2, step: 0.05 },
				{ id: 'green', type: 'number', label: 'Green (0 to 2)', default: 1, min: 0, max: 2, step: 0.05 },
				{ id: 'blue', type: 'number', label: 'Blue (0 to 2)', default: 1, min: 0, max: 2, step: 0.05 },
			],
			callback: async (event) =>
				self.postCmd('/api/warp/color', {
					videoColorSettings: {
						brightness: Number(event.options.brightness),
						contrast: Number(event.options.contrast),
						red: Number(event.options.red),
						green: Number(event.options.green),
						blue: Number(event.options.blue),
					},
				}),
		},

		// ---- Sync (inter-instance Master/Slave) ----
		sync_mode: {
			name: 'Sync: Set sync mode (Off / Master / Slave)',
			options: [{ id: 'syncMode', type: 'dropdown', label: 'Sync mode', default: 0, choices: SYNC_MODE_CHOICES }],
			callback: async (event) => self.postCmd('/api/control/sync-mode', { syncMode: Number(event.options.syncMode) }),
		},

		// ---- MQTT (transport, separate from the sync mode above) ----
		mqtt_enable: {
			name: 'MQTT: Enable / disable',
			options: [{ id: 'state', type: 'dropdown', label: 'MQTT', default: 'toggle', choices: MQTT_STATE_CHOICES }],
			callback: async (event) => {
				const state = String(event.options.state)
				const enabled = state === 'on' ? true : state === 'off' ? false : !(self.status?.control?.enableMqtt === true)
				return self.postCmd('/api/control/settings', { enableMqtt: enabled })
			},
		},

		// ---- App ----
		language: {
			name: 'App: Language',
			options: [{ id: 'language', type: 'dropdown', label: 'Language', default: 'en', choices: LANGUAGE_CHOICES }],
			callback: async (event) => self.postCmd('/api/language', { language: String(event.options.language) }),
		},
	}

	self.setActionDefinitions(actions)
}
