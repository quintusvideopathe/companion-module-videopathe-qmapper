import type { CompanionVariableValues } from '@companion-module/base'
import {
	formatDuration,
	progressRatio,
	remainingMs,
	safeNumber,
	sourceModeGroup,
	sourceModeLabel,
	syncModeLabel,
} from './state.js'
import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{ variableId: 'connection_status', name: 'Connection status' },
		{ variableId: 'server_url', name: 'Server URL' },
		{ variableId: 'device_name', name: 'Device name' },
		{ variableId: 'device_ip', name: 'Device IP address' },
		{ variableId: 'app_version', name: 'QMapper version' },

		{ variableId: 'playing', name: 'Playlist playing (true/false)' },
		{ variableId: 'shuffle', name: 'Shuffle enabled (true/false)' },
		{ variableId: 'position', name: 'Playback position (m:ss)' },
		{ variableId: 'duration', name: 'Media duration (m:ss)' },
		{ variableId: 'remaining', name: 'Remaining time (m:ss)' },
		{ variableId: 'progress_percent', name: 'Playback progress (%)' },

		{ variableId: 'current_filename', name: 'Current media filename' },
		{ variableId: 'current_index', name: 'Current playlist index' },
		{ variableId: 'enabled_index', name: 'Current enabled index (1-based)' },
		{ variableId: 'enabled_count', name: 'Enabled media count' },
		{ variableId: 'source_mode', name: 'Active source (short id)' },
		{ variableId: 'source_mode_label', name: 'Active source (label)' },

		{ variableId: 'blackout', name: 'Blackout active (true/false)' },
		{ variableId: 'grid_visible', name: 'Mapping grid visible (true/false)' },
		{ variableId: 'main_visible', name: 'Warp main output visible (true/false)' },
		{ variableId: 'layer_count', name: 'Named warp layers count' },
		{ variableId: 'layer_names', name: 'Named warp layers (comma list)' },
		{ variableId: 'sync_mode', name: 'Sync mode (0/1/2)' },
		{ variableId: 'sync_mode_label', name: 'Sync mode label' },
		{ variableId: 'mqtt_enabled', name: 'MQTT enabled (true/false)' },
		{ variableId: 'language', name: 'UI language' },

		{ variableId: 'cpu_usage', name: 'CPU usage (%)' },
		{ variableId: 'fps', name: 'Render FPS' },
		{ variableId: 'cpu_temp', name: 'CPU temperature (°C)' },
		{ variableId: 'ram_used', name: 'RAM used (MB)' },
		{ variableId: 'ram_total', name: 'RAM total (MB)' },
		{ variableId: 'resolution', name: 'Display resolution' },
		{ variableId: 'refresh_rate', name: 'Display refresh rate (Hz)' },
		{ variableId: 'active_layers', name: 'Active mapping layers' },
		{ variableId: 'loaded_media', name: 'Loaded media count' },
		{ variableId: 'connection_type', name: 'Network connection type' },
	])
}

function boolText(value: boolean | undefined): string {
	return value === true ? 'true' : 'false'
}

export function buildVariableValues(self: ModuleInstance): CompanionVariableValues {
	const status = self.status
	const playlist = status?.playlist
	const current = playlist?.current
	const system = status?.system
	const control = status?.control

	return {
		connection_status: self.isConnected ? 'ok' : self.lastError ? 'connection_failure' : 'disconnected',
		server_url: self.getBaseUrl(),
		device_name: control?.deviceName ?? '',
		device_ip: system?.ipAddress ?? '',
		app_version: system?.appVersion ?? '',

		playing: boolText(playlist?.isPlaying),
		shuffle: boolText(playlist?.shuffleMode),
		position: formatDuration(safeNumber(playlist?.currentPosition)),
		duration: formatDuration(safeNumber(playlist?.duration)),
		remaining: formatDuration(remainingMs(status)),
		progress_percent: Math.round(progressRatio(status) * 100),

		current_filename: current?.filename ?? '',
		current_index: safeNumber(current?.currentIndex, -1),
		enabled_index: safeNumber(current?.enabledIndex),
		enabled_count: safeNumber(current?.enabledCount),
		source_mode: sourceModeGroup(current?.sourceMode),
		source_mode_label: sourceModeLabel(current?.sourceMode),

		blackout: boolText(self.blackout),
		grid_visible: boolText(status?.warp?.gridVisible),
		main_visible: boolText(self.getMainVisible()),
		layer_count: self.getLayerNames().length,
		layer_names: self.getLayerNames().join(', '),
		sync_mode: safeNumber(control?.syncMode),
		sync_mode_label: syncModeLabel(control?.syncMode),
		mqtt_enabled: boolText(control?.enableMqtt),
		language: self.language ?? '',

		cpu_usage: Math.round(safeNumber(system?.cpuUsage)),
		fps: Math.round(safeNumber(system?.fps)),
		cpu_temp: Math.round(safeNumber(system?.cpuTemperature)),
		ram_used: safeNumber(system?.ramUsed),
		ram_total: safeNumber(system?.ramTotal),
		resolution: system?.displayResolution ?? '',
		refresh_rate: Math.round(safeNumber(system?.refreshRate)),
		active_layers: safeNumber(system?.activeLayers),
		loaded_media: safeNumber(system?.loadedMedia),
		connection_type: system?.connectionType ?? '',
	}
}
