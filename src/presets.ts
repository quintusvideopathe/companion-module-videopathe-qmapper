import {
	combineRgb,
	type CompanionButtonPresetDefinition,
	type CompanionOptionValues,
	type CompanionPresetDefinitions,
} from '@companion-module/base'
import type { ModuleInstance } from './main.js'

const MODULE_ID = 'videopathe-qmapper'
const BLACK = combineRgb(0, 0, 0)
const WHITE = combineRgb(255, 255, 255)
const PANEL = combineRgb(24, 32, 46)

export function UpdatePresets(self: ModuleInstance): void {
	void self
	const presets: CompanionPresetDefinitions = {}
	const variable = (name: string): string => `$(${MODULE_ID}:${name})`

	const disconnected = {
		feedbackId: 'connected',
		options: {},
		isInverted: true,
		style: { bgcolor: combineRgb(80, 20, 20), color: WHITE },
	}

	function button(
		id: string,
		category: string,
		name: string,
		style: CompanionButtonPresetDefinition['style'],
		actions: { actionId: string; options?: CompanionOptionValues }[],
		feedbacks: CompanionButtonPresetDefinition['feedbacks'] = [],
	): void {
		presets[id] = {
			type: 'button',
			category,
			name,
			style: { show_topbar: false, ...style },
			steps: actions.length ? [{ down: actions.map((a) => ({ actionId: a.actionId, options: a.options ?? {} })), up: [] }] : [{ down: [], up: [] }],
			feedbacks: [disconnected, ...feedbacks],
		}
	}

	// ---- Transport ----
	button(
		'playlist_play',
		'Playlist',
		'Play',
		{ text: '▶ PLAY', size: '18', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'playlist_play' }],
		[{ feedbackId: 'playlist_playing', options: {}, style: { bgcolor: combineRgb(34, 197, 94), color: BLACK } }],
	)
	button('playlist_pause', 'Playlist', 'Pause', { text: '⏸ PAUSE', size: '18', color: WHITE, bgcolor: PANEL }, [{ actionId: 'playlist_pause' }])
	button('playlist_stop', 'Playlist', 'Stop', { text: '⏹ STOP', size: '18', color: WHITE, bgcolor: PANEL }, [{ actionId: 'playlist_stop' }])
	button('playlist_prev', 'Playlist', 'Previous', { text: '⏮ PREV', size: '18', color: WHITE, bgcolor: PANEL }, [{ actionId: 'playlist_prev' }])
	button('playlist_next', 'Playlist', 'Next', { text: '⏭ NEXT', size: '18', color: WHITE, bgcolor: PANEL }, [{ actionId: 'playlist_next' }])
	button(
		'playlist_shuffle',
		'Playlist',
		'Shuffle indicator',
		{ text: '🔀\\nSHUFFLE', size: '14', color: WHITE, bgcolor: PANEL },
		[],
		[{ feedbackId: 'playlist_shuffle', options: {}, style: { bgcolor: combineRgb(139, 92, 246), color: WHITE } }],
	)

	// ---- Now playing + progress bar (animated) ----
	button(
		'now_playing',
		'Now playing',
		'Now playing (name + index)',
		{ text: `${variable('current_filename')}\\n${variable('enabled_index')}/${variable('enabled_count')}`, size: '14', color: WHITE, bgcolor: combineRgb(15, 23, 35) },
		[{ actionId: 'playlist_play' }],
		[{ feedbackId: 'playlist_playing', options: {}, style: { bgcolor: combineRgb(20, 60, 30), color: WHITE } }],
	)
	button(
		'progress_bar',
		'Now playing',
		'Progress bar + time (animated)',
		{ text: `${variable('position')}\\n${variable('remaining')}`, size: '14', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'playlist_play' }],
		[{ feedbackId: 'playlist_progress', options: {} }],
	)
	button(
		'progress_percent',
		'Now playing',
		'Progress percent readout',
		{ text: `${variable('progress_percent')}%\\n${variable('position')}`, size: '18', color: WHITE, bgcolor: combineRgb(15, 23, 35) },
		[],
	)

	// ---- Source switch ----
	const sources: { id: string; label: string }[] = [
		{ id: 'playlist', label: 'PLAYLIST' },
		{ id: 'ndi', label: 'NDI' },
		{ id: 'omt', label: 'OMT' },
		{ id: 'srt', label: 'SRT' },
		{ id: 'rtsp', label: 'RTSP' },
		{ id: 'usb', label: 'USB' },
	]
	for (const source of sources) {
		button(
			`source_${source.id}`,
			'Sources',
			`Switch to ${source.label}`,
			{ text: source.label, size: '14', color: WHITE, bgcolor: PANEL },
			[{ actionId: 'source_switch', options: { sourceMode: source.id, transition: 'fade', fadeMs: 800, usbDeviceKey: '' } }],
			[{ feedbackId: 'source_mode', options: { mode: source.id }, style: { bgcolor: combineRgb(16, 185, 129), color: BLACK } }],
		)
	}
	button(
		'source_webrtc_indicator',
		'Sources',
		'WebRTC active (indicator + disconnect)',
		{ text: 'WEBRTC', size: '18', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'source_disconnect', options: { input: 'webrtc' } }],
		[{ feedbackId: 'source_mode', options: { mode: 'webrtc' }, style: { bgcolor: combineRgb(16, 185, 129), color: BLACK } }],
	)
	button(
		'source_disconnect',
		'Sources',
		'Disconnect RTSP input',
		{ text: 'RTSP\\nDISC.', size: '14', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'source_disconnect', options: { input: 'rtsp' } }],
	)

	// ---- Blackout (pulsing) ----
	button(
		'blackout',
		'Output',
		'Blackout (pulsing)',
		{ text: '⬛ BLACK\\nOUT', size: '14', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'blackout', options: { state: 'toggle' } }],
		[{ feedbackId: 'blackout_pulse', options: {} }],
	)

	// ---- Warp ----
	button(
		'warp_grid',
		'Warp',
		'Toggle mapping grid',
		{ text: '# GRID', size: '18', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'warp_grid', options: { state: 'toggle' } }],
		[{ feedbackId: 'grid_visible', options: {}, style: { bgcolor: combineRgb(234, 179, 8), color: BLACK } }],
	)
	button(
		'warp_main',
		'Warp',
		'Main visibility (toggle)',
		{ text: 'MAIN\\nVISIB.', size: '14', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'warp_visibility_main', options: { state: 'toggle' } }],
		[{ feedbackId: 'warp_main_visible', options: {}, style: { bgcolor: combineRgb(34, 197, 94), color: BLACK } }],
	)
	// One ready-made toggle button per named warp layer (rebuilt when they change).
	for (const layerName of self.getLayerNames()) {
		const slug = layerName.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
		button(
			`layer_${slug}`,
			'Warp layers',
			`Layer: ${layerName}`,
			{ text: layerName, size: '14', color: WHITE, bgcolor: PANEL },
			[{ actionId: 'warp_visibility_layer', options: { name: layerName, state: 'toggle' } }],
			[{ feedbackId: 'warp_layer_visible', options: { name: layerName }, style: { bgcolor: combineRgb(34, 197, 94), color: BLACK } }],
		)
	}

	// ---- Sync ----
	const syncModes: { id: number; label: string }[] = [
		{ id: 0, label: 'SYNC\\nOFF' },
		{ id: 1, label: 'SYNC\\nMASTER' },
		{ id: 2, label: 'SYNC\\nSLAVE' },
	]
	for (const mode of syncModes) {
		button(
			`sync_${mode.id}`,
			'Sync',
			`Sync ${mode.label.replace('\\n', ' ')}`,
			{ text: mode.label, size: '14', color: WHITE, bgcolor: PANEL },
			[{ actionId: 'sync_mode', options: { syncMode: mode.id } }],
			[{ feedbackId: 'sync_mode', options: { mode: mode.id }, style: { bgcolor: combineRgb(59, 130, 246), color: WHITE } }],
		)
	}
	button(
		'mqtt_toggle',
		'Sync',
		'MQTT enable (transport)',
		{ text: 'MQTT', size: '18', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'mqtt_enable', options: { state: 'toggle' } }],
		[{ feedbackId: 'mqtt_enabled', options: {}, style: { bgcolor: combineRgb(16, 185, 129), color: BLACK } }],
	)

	// ---- Language ----
	button(
		'language_fr',
		'App',
		'Language FR',
		{ text: 'FR', size: '24', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'language', options: { language: 'fr' } }],
		[{ feedbackId: 'language_matches', options: { value: 'fr' }, style: { bgcolor: combineRgb(59, 130, 246), color: WHITE } }],
	)
	button(
		'language_en',
		'App',
		'Language EN',
		{ text: 'EN', size: '24', color: WHITE, bgcolor: PANEL },
		[{ actionId: 'language', options: { language: 'en' } }],
		[{ feedbackId: 'language_matches', options: { value: 'en' }, style: { bgcolor: combineRgb(59, 130, 246), color: WHITE } }],
	)

	// ---- Readouts ----
	button('readout_status', 'Readouts', 'Connection status', {
		text: `QMapper\\n${variable('connection_status')}\\n${variable('source_mode_label')}`,
		size: '14',
		color: WHITE,
		bgcolor: combineRgb(15, 23, 35),
	}, [], [{ feedbackId: 'connected', options: {}, style: { bgcolor: combineRgb(20, 60, 30), color: WHITE } }])
	button('readout_system', 'Readouts', 'System (CPU / FPS / temp)', {
		text: `CPU ${variable('cpu_usage')}%\\nFPS ${variable('fps')}\\n${variable('cpu_temp')}°C`,
		size: '14',
		color: WHITE,
		bgcolor: combineRgb(15, 23, 35),
	}, [])

	self.setPresetDefinitions(presets)
}
