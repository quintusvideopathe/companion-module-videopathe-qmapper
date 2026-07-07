import type { DropdownChoice } from '@companion-module/base'

export const STATE_CHOICES: DropdownChoice[] = [
	{ id: 'toggle', label: 'Toggle' },
	{ id: 'on', label: 'On' },
	{ id: 'off', label: 'Off' },
]

// Visibility endpoints have no toggle route, so on/off only.
export const ON_OFF_CHOICES: DropdownChoice[] = [
	{ id: 'on', label: 'On' },
	{ id: 'off', label: 'Off' },
]

// Sources the module can switch TO. playlist/ndi/omt/srt go through
// /api/control/source-switch; rtsp re-activates the last RTSP URL; usb opens the
// USB capture device. (WebRTC is a receiver started by an incoming offer, so it
// can't be "switched to" from a button — only disconnected.)
export const SOURCE_MODE_CHOICES: DropdownChoice[] = [
	{ id: 'playlist', label: 'Playlist (local media)' },
	{ id: 'ndi', label: 'NDI input' },
	{ id: 'omt', label: 'OMT input' },
	{ id: 'srt', label: 'SRT input' },
	{ id: 'rtsp', label: 'RTSP input (last URL)' },
	{ id: 'usb', label: 'USB capture' },
]

// Sources that use /api/control/source-switch with a fade/cut transition.
export const FADEABLE_SOURCES = ['playlist', 'ndi', 'omt', 'srt']

// Network inputs that can be disconnected (returns to the playlist source).
export const DISCONNECT_INPUT_CHOICES: DropdownChoice[] = [
	{ id: 'rtsp', label: 'RTSP input' },
	{ id: 'usb', label: 'USB capture' },
	{ id: 'webrtc', label: 'WebRTC input' },
]

export const MQTT_STATE_CHOICES: DropdownChoice[] = [
	{ id: 'toggle', label: 'Toggle' },
	{ id: 'on', label: 'Enable' },
	{ id: 'off', label: 'Disable' },
]

// All source modes QMapper can report (for feedbacks/variables).
export const SOURCE_MODE_MATCH_CHOICES: DropdownChoice[] = [
	{ id: 'playlist', label: 'Playlist' },
	{ id: 'ndi', label: 'NDI' },
	{ id: 'omt', label: 'OMT' },
	{ id: 'srt', label: 'SRT' },
	{ id: 'rtsp', label: 'RTSP' },
	{ id: 'webrtc', label: 'WebRTC' },
	{ id: 'usb', label: 'USB' },
]

export const TRANSITION_CHOICES: DropdownChoice[] = [
	{ id: 'fade', label: 'Fade' },
	{ id: 'cut', label: 'Cut' },
]

export const SYNC_MODE_CHOICES: DropdownChoice[] = [
	{ id: 0, label: 'Off (standalone)' },
	{ id: 1, label: 'Master' },
	{ id: 2, label: 'Slave' },
]

export const REPEAT_MODE_CHOICES: DropdownChoice[] = [
	{ id: 0, label: 'No repeat' },
	{ id: 1, label: 'Repeat one' },
	{ id: 2, label: 'Repeat all' },
]

export const LANGUAGE_CHOICES: DropdownChoice[] = [
	{ id: 'fr', label: 'Français' },
	{ id: 'en', label: 'English' },
]

export const COMPARISON_CHOICES: DropdownChoice[] = [
	{ id: 'lt', label: '<' },
	{ id: 'lte', label: '<=' },
	{ id: 'gte', label: '>=' },
	{ id: 'gt', label: '>' },
]
