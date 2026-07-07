import { combineRgb, type CompanionFeedbackDefinitions, type DropdownChoice } from '@companion-module/base'
import { COMPARISON_CHOICES, LANGUAGE_CHOICES, SOURCE_MODE_MATCH_CHOICES, SYNC_MODE_CHOICES } from './choices.js'
import { drawProgressBarPng } from './png.js'
import { remainingMs, safeNumber, sourceModeGroup } from './state.js'
import type { ModuleInstance } from './main.js'

function compare(operator: string, actual: number, expected: number): boolean {
	switch (operator) {
		case 'lt':
			return actual < expected
		case 'lte':
			return actual <= expected
		case 'gt':
			return actual > expected
		case 'gte':
			return actual >= expected
		default:
			return false
	}
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const layerNames: DropdownChoice[] = self.getLayerNames().map((name) => ({ id: name, label: name }))

	const feedbacks: CompanionFeedbackDefinitions = {
		connected: {
			name: 'Connection is OK',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) },
			options: [],
			callback: () => self.isConnected,
		},

		playlist_playing: {
			name: 'Playlist is playing',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) },
			options: [],
			callback: () => self.status?.playlist?.isPlaying === true,
		},
		playlist_stopped: {
			name: 'Playlist is stopped / paused',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(120, 120, 120), color: combineRgb(0, 0, 0) },
			options: [],
			callback: () => self.status?.playlist?.isPlaying !== true,
		},
		playlist_shuffle: {
			name: 'Shuffle is enabled',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(139, 92, 246), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => self.status?.playlist?.shuffleMode === true,
		},
		current_index: {
			name: 'Current playlist index matches',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(99, 102, 241), color: combineRgb(255, 255, 255) },
			options: [{ id: 'index', type: 'number', label: 'Index (0-based)', default: 0, min: 0, max: 9999 }],
			callback: (feedback) => safeNumber(self.status?.playlist?.current?.currentIndex, -1) === Number(feedback.options.index),
		},

		// ---- Blackout ----
		blackout_active: {
			name: 'Blackout is active',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => self.blackout === true,
		},
		blackout_pulse: {
			name: 'Blackout — pulsing (animated)',
			type: 'advanced',
			options: [],
			callback: () => {
				if (self.blackout !== true) return {}
				const brightness = 0.35 + 0.65 * self.pulsePhase
				return {
					bgcolor: combineRgb(Math.round(220 * brightness), Math.round(30 * brightness), Math.round(30 * brightness)),
					color: combineRgb(255, 255, 255),
					text: '⬛ BLACK',
				}
			},
		},

		// ---- Warp ----
		grid_visible: {
			name: 'Mapping grid is shown',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
			options: [],
			callback: () => self.status?.warp?.gridVisible === true,
		},
		warp_main_visible: {
			name: 'Warp: Main output is visible',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) },
			options: [],
			callback: () => self.getMainVisible(),
		},
		warp_layer_visible: {
			name: 'Warp: Layer is visible',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) },
			options: [
				{
					id: 'name',
					type: 'dropdown',
					label: 'Layer',
					default: layerNames[0]?.id ?? '',
					choices: layerNames,
					allowCustom: true,
				},
			],
			callback: (feedback) => self.getLayerVisible(String(feedback.options.name)),
		},

		// ---- Modes ----
		source_mode: {
			name: 'Active source matches',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(16, 185, 129), color: combineRgb(0, 0, 0) },
			options: [{ id: 'mode', type: 'dropdown', label: 'Source', default: 'playlist', choices: SOURCE_MODE_MATCH_CHOICES }],
			callback: (feedback) => sourceModeGroup(self.status?.playlist?.current?.sourceMode) === String(feedback.options.mode),
		},
		sync_mode: {
			name: 'Sync mode matches',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(59, 130, 246), color: combineRgb(255, 255, 255) },
			options: [{ id: 'mode', type: 'dropdown', label: 'Sync mode', default: 0, choices: SYNC_MODE_CHOICES }],
			callback: (feedback) => safeNumber(self.status?.control?.syncMode) === Number(feedback.options.mode),
		},
		mqtt_enabled: {
			name: 'MQTT is enabled',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(16, 185, 129), color: combineRgb(0, 0, 0) },
			options: [],
			callback: () => self.status?.control?.enableMqtt === true,
		},
		language_matches: {
			name: 'UI language matches',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(59, 130, 246), color: combineRgb(255, 255, 255) },
			options: [{ id: 'value', type: 'dropdown', label: 'Language', default: 'en', choices: LANGUAGE_CHOICES }],
			callback: (feedback) => String(self.language ?? '') === String(feedback.options.value),
		},

		// ---- Comparisons ----
		remaining_compare: {
			name: 'Remaining time comparison',
			type: 'boolean',
			defaultStyle: { bgcolor: combineRgb(234, 88, 12), color: combineRgb(255, 255, 255) },
			options: [
				{ id: 'operator', type: 'dropdown', label: 'Operator', default: 'lte', choices: COMPARISON_CHOICES },
				{ id: 'seconds', type: 'number', label: 'Seconds', default: 10, min: 0, max: 86400 },
			],
			callback: (feedback) =>
				compare(String(feedback.options.operator), remainingMs(self.status) / 1000, Number(feedback.options.seconds)),
		},

		// ---- Animated: playback progress bar drawn on the button ----
		playlist_progress: {
			name: 'Playlist progress bar (animated)',
			type: 'advanced',
			options: [],
			callback: () => ({
				png64: drawProgressBarPng({
					progress: self.getAnimatedProgress(),
					playing: self.status?.playlist?.isPlaying === true,
				}),
			}),
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
