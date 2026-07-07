// Mirrors QMapper's aggregated /api/status response (+ /api/blackout, /api/language).

export interface QMapperCurrent {
	currentIndex?: number
	filename?: string
	enabledIndex?: number
	enabledCount?: number
	sourceMode?: string
}

export interface QMapperPlaylist {
	isPlaying?: boolean
	currentPosition?: number
	duration?: number
	shuffleMode?: boolean
	current?: QMapperCurrent
}

export interface QMapperWarp {
	gridVisible?: boolean
	color?: Record<string, number>
}

export interface WarpLayer {
	id?: string
	type?: string // 'main' | 'shape' | 'image'
	name?: string
	visible?: boolean
}

export function mainLayer(layers: WarpLayer[] | undefined): WarpLayer | undefined {
	return (layers ?? []).find((layer) => String(layer.type ?? '').toLowerCase() === 'main')
}

// Non-main layers that have a usable name (the ones worth listing per-layer).
export function namedLayers(layers: WarpLayer[] | undefined): WarpLayer[] {
	return (layers ?? []).filter((layer) => {
		const type = String(layer.type ?? '').toLowerCase()
		return type !== 'main' && !!String(layer.name ?? '').trim()
	})
}

export function findLayerByName(layers: WarpLayer[] | undefined, name: string): WarpLayer | undefined {
	const target = String(name ?? '').trim().toLowerCase()
	return (layers ?? []).find((layer) => String(layer.name ?? '').trim().toLowerCase() === target)
}

export interface QMapperControl {
	deviceName?: string
	syncMode?: number
	apiPort?: number
	enableMqtt?: boolean
	mqttBroker?: string
}

export interface QMapperSystem {
	deviceModel?: string
	androidVersion?: string
	displayResolution?: string
	refreshRate?: number
	cpuUsage?: number
	ramUsed?: number
	ramTotal?: number
	cpuTemperature?: number
	fps?: number
	uptime?: string | number
	ipAddress?: string
	appVersion?: string
	loadedMedia?: number
	activeLayers?: number
	connectionType?: string
}

export interface QMapperStatus {
	status?: string
	timestamp?: string
	playlist?: QMapperPlaylist
	warp?: QMapperWarp
	control?: QMapperControl
	system?: QMapperSystem
}

export function safeNumber(value: unknown, fallback = 0): number {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

export function clampNumber(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

export function formatDuration(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(safeNumber(ms) / 1000))
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60
	const pad = (value: number): string => String(value).padStart(2, '0')
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

export function progressRatio(status: QMapperStatus | undefined): number {
	const duration = safeNumber(status?.playlist?.duration)
	if (duration <= 0) return 0
	return clampNumber(safeNumber(status?.playlist?.currentPosition) / duration, 0, 1)
}

export function remainingMs(status: QMapperStatus | undefined): number {
	const duration = safeNumber(status?.playlist?.duration)
	const position = safeNumber(status?.playlist?.currentPosition)
	return Math.max(0, duration - position)
}

// resolveSourceMode values from QMapper, normalised to short labels.
const SOURCE_MODE_LABELS: Record<string, string> = {
	playlist: 'Playlist',
	'ndi-input': 'NDI',
	'omt-input': 'OMT',
	'srt-input': 'SRT',
	'rtsp-input': 'RTSP',
	'webrtc-input': 'WebRTC',
	'usb-input': 'USB',
}

export function sourceModeLabel(mode: string | undefined): string {
	const key = String(mode ?? '').toLowerCase()
	return SOURCE_MODE_LABELS[key] ?? (key || 'Playlist')
}

// The source-switch action normalises everything down to these four targets.
export function sourceModeGroup(mode: string | undefined): string {
	const key = String(mode ?? '').toLowerCase()
	if (key.startsWith('ndi')) return 'ndi'
	if (key.startsWith('omt')) return 'omt'
	if (key.startsWith('srt')) return 'srt'
	if (key.startsWith('playlist')) return 'playlist'
	return key.replace('-input', '')
}

export function syncModeLabel(mode: number | undefined): string {
	switch (safeNumber(mode, 0)) {
		case 1:
			return 'Master'
		case 2:
			return 'Slave'
		default:
			return 'Off'
	}
}
