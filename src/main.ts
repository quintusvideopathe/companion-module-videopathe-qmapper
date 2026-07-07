import { InstanceBase, InstanceStatus, type SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { buildBaseUrl, fetchJson, postCommand } from './api.js'
import { UpdateActions } from './actions.js'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import {
	clampNumber,
	findLayerByName,
	mainLayer,
	namedLayers,
	progressRatio,
	safeNumber,
	type QMapperStatus,
	type WarpLayer,
} from './state.js'
import { UpgradeScripts } from './upgrades.js'
import { buildVariableValues, UpdateVariableDefinitions } from './variables.js'

const ANIMATION_INTERVAL_MS = 80

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig
	status: QMapperStatus | undefined
	warpLayers: WarpLayer[] = []
	blackout = false
	language = ''
	lastError: string | null = null
	pulsePhase = 0.5

	private layerSignature = ''

	private pollTimer: NodeJS.Timeout | undefined
	private animationTimer: NodeJS.Timeout | undefined
	private pollInFlight = false
	private abortController = new AbortController()
	private connected = false

	// For smoothly interpolating the progress bar between polls.
	private lastPositionMs = 0
	private lastDurationMs = 0
	private lastPollAt = 0
	private lastPlaying = false

	constructor(internal: unknown) {
		super(internal)
	}

	get isConnected(): boolean {
		return this.connected
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		UpdateVariableDefinitions(this)
		this.pushVariables()
		this.startPolling(true)
		this.startAnimation()
	}

	async destroy(): Promise<void> {
		this.abortController.abort()
		this.stopPolling()
		this.stopAnimation()
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.abortController.abort()
		this.abortController = new AbortController()
		this.pollInFlight = false
		this.config = config
		this.status = undefined
		this.connected = false
		this.pushVariables()
		this.checkFeedbacks()
		this.startPolling(true)
		this.startAnimation()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	getBaseUrl(): string {
		return buildBaseUrl(this.config?.host ?? '', safeNumber(this.config?.port, 2226))
	}

	private hasValidConfig(): boolean {
		return !!this.config?.host?.trim() && safeNumber(this.config?.port) > 0
	}

	// ---- Polling ----

	private startPolling(runImmediately: boolean): void {
		this.stopPolling()
		if (!this.hasValidConfig()) {
			this.updateStatus(InstanceStatus.BadConfig)
			this.connected = false
			this.pushVariables()
			this.checkFeedbacks()
			return
		}
		this.updateStatus(InstanceStatus.Connecting)
		const interval = Math.max(150, safeNumber(this.config.pollInterval, 400))
		this.pollTimer = setInterval(() => void this.refreshState(), interval)
		if (runImmediately) void this.refreshState()
	}

	private stopPolling(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}
	}

	async refreshState(): Promise<void> {
		if (this.pollInFlight || !this.hasValidConfig()) return
		this.pollInFlight = true
		const controller = this.abortController
		const base = this.getBaseUrl()
		try {
			const status = await fetchJson<QMapperStatus>(`${base}/api/status`, { signal: controller.signal })
			if (controller !== this.abortController) return
			this.status = status
			this.connected = true
			this.lastError = null

			// Extra endpoints (non-fatal on failure):
			//  - /api/playlist/status: the authoritative playback position/duration
			//    (same one QMapper's own UI uses) — more reliable than the aggregate.
			//  - /api/warp: the mapping layers list + visibility.
			//  - /api/blackout, /api/language: extra state.
			const [playback, warp, blackout, language] = await Promise.all([
				fetchJson<{ isPlaying?: boolean; currentPosition?: number; duration?: number; shuffleMode?: boolean }>(
					`${base}/api/playlist/status`,
					{ signal: controller.signal },
				).catch(() => undefined),
				fetchJson<{ layers?: WarpLayer[] }>(`${base}/api/warp`, { signal: controller.signal }).catch(() => undefined),
				fetchJson<{ isBlackout?: boolean }>(`${base}/api/blackout`, { signal: controller.signal }).catch(() => undefined),
				fetchJson<{ language?: string }>(`${base}/api/language`, { signal: controller.signal }).catch(() => undefined),
			])
			if (controller !== this.abortController) return

			if (playback && (this.status.playlist || playback)) {
				this.status.playlist = {
					...(this.status.playlist ?? {}),
					isPlaying: playback.isPlaying ?? this.status.playlist?.isPlaying,
					currentPosition: safeNumber(playback.currentPosition, safeNumber(this.status.playlist?.currentPosition)),
					duration: safeNumber(playback.duration, safeNumber(this.status.playlist?.duration)),
					shuffleMode: playback.shuffleMode ?? this.status.playlist?.shuffleMode,
				}
			}
			if (blackout && typeof blackout.isBlackout === 'boolean') this.blackout = blackout.isBlackout
			if (language && typeof language.language === 'string') this.language = language.language
			this.applyWarpLayers(Array.isArray(warp?.layers) ? warp.layers : [])

			this.lastPositionMs = safeNumber(this.status.playlist?.currentPosition)
			this.lastDurationMs = safeNumber(this.status.playlist?.duration)
			this.lastPlaying = this.status.playlist?.isPlaying === true
			this.lastPollAt = Date.now()

			this.updateStatus(InstanceStatus.Ok)
			this.pushVariables()
			this.checkFeedbacks()
		} catch (error) {
			if (controller !== this.abortController || controller.signal.aborted) return
			this.connected = false
			this.lastError = error instanceof Error ? error.message : String(error)
			this.updateStatus(InstanceStatus.ConnectionFailure, this.lastError)
			this.pushVariables()
			this.checkFeedbacks()
		} finally {
			this.pollInFlight = false
		}
	}

	// ---- Command dispatch ----

	async postCmd(path: string, body?: unknown): Promise<void> {
		if (!this.hasValidConfig()) {
			this.updateStatus(InstanceStatus.BadConfig)
			return
		}
		try {
			await postCommand(this.getBaseUrl(), path, body)
			void this.refreshState()
		} catch (error) {
			this.connected = false
			this.lastError = error instanceof Error ? error.message : String(error)
			this.log('error', `Command ${path} failed: ${this.lastError}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, this.lastError)
			this.checkFeedbacks()
		}
	}

	// ---- Animation ----

	private startAnimation(): void {
		this.stopAnimation()
		if (this.config?.animate === false) return
		this.animationTimer = setInterval(() => this.animationTick(), ANIMATION_INTERVAL_MS)
	}

	private stopAnimation(): void {
		if (this.animationTimer) {
			clearInterval(this.animationTimer)
			this.animationTimer = undefined
		}
	}

	private animationTick(): void {
		this.pulsePhase = 0.5 + 0.5 * Math.sin(Date.now() / 350)
		if (!this.connected) return
		this.checkFeedbacks('playlist_progress', 'blackout_pulse')
	}

	// Interpolates the playback position between polls so the bar moves smoothly.
	getAnimatedProgress(): number {
		if (this.lastDurationMs <= 0) return progressRatio(this.status)
		let position = this.lastPositionMs
		if (this.lastPlaying && this.lastPollAt > 0) position += Date.now() - this.lastPollAt
		return clampNumber(position / this.lastDurationMs, 0, 1)
	}

	// ---- Warp layers ----

	private applyWarpLayers(layers: WarpLayer[]): void {
		this.warpLayers = layers
		// Rebuild the layer-name dropdowns / per-layer presets only when the set of
		// named layers actually changes, so we don't thrash Companion every poll.
		const signature = namedLayers(layers)
			.map((layer) => `${layer.name}`)
			.join('|')
		if (signature !== this.layerSignature) {
			this.layerSignature = signature
			this.updateActions()
			this.updateFeedbacks()
			this.updatePresets()
		}
	}

	getLayerNames(): string[] {
		return namedLayers(this.warpLayers).map((layer) => String(layer.name))
	}

	getMainVisible(): boolean {
		return mainLayer(this.warpLayers)?.visible !== false
	}

	getLayerVisible(name: string): boolean {
		return findLayerByName(this.warpLayers, name)?.visible !== false
	}

	private pushVariables(): void {
		this.setVariableValues(buildVariableValues(this))
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
