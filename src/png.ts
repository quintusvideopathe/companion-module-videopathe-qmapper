import { deflateSync } from 'node:zlib'

// Minimal dependency-free 8-bit RGBA PNG encoder, used to draw a playback
// progress bar directly onto a Companion button (advanced feedback `png64`).

const CRC_TABLE = ((): Int32Array => {
	const table = new Int32Array(256)
	for (let n = 0; n < 256; n += 1) {
		let c = n
		for (let k = 0; k < 8; k += 1) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
		table[n] = c
	}
	return table
})()

function crc32(buffer: Buffer): number {
	let crc = 0xffffffff
	for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8)
	return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
	const length = Buffer.alloc(4)
	length.writeUInt32BE(data.length, 0)
	const typeBuffer = Buffer.from(type, 'ascii')
	const crc = Buffer.alloc(4)
	crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
	return Buffer.concat([length, typeBuffer, data, crc])
}

export function encodePng(width: number, height: number, rgba: Buffer): string {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
	const ihdr = Buffer.alloc(13)
	ihdr.writeUInt32BE(width, 0)
	ihdr.writeUInt32BE(height, 4)
	ihdr[8] = 8
	ihdr[9] = 6
	const stride = width * 4
	const raw = Buffer.alloc((stride + 1) * height)
	for (let y = 0; y < height; y += 1) {
		raw[y * (stride + 1)] = 0
		rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
	}
	const idat = deflateSync(raw)
	return Buffer.concat([
		signature,
		pngChunk('IHDR', ihdr),
		pngChunk('IDAT', idat),
		pngChunk('IEND', Buffer.alloc(0)),
	]).toString('base64')
}

type RGB = [number, number, number]

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value))
}

export interface ProgressBarOptions {
	progress: number // 0-1
	color?: RGB
	bg?: RGB
	width?: number
	height?: number
	playing?: boolean
}

// Draws the whole button dark with a chunky progress bar across the bottom; the
// caller overlays the "now playing" / time text on top via the feedback text.
export function drawProgressBarPng({
	progress,
	color = [56, 189, 248],
	bg = [12, 18, 28],
	width = 72,
	height = 72,
	playing = true,
}: ProgressBarOptions): string {
	const rgba = Buffer.alloc(width * height * 4)
	for (let i = 0; i < width * height; i += 1) {
		rgba[i * 4] = bg[0]
		rgba[i * 4 + 1] = bg[1]
		rgba[i * 4 + 2] = bg[2]
		rgba[i * 4 + 3] = 255
	}
	const setPixel = (x: number, y: number, rgb: RGB): void => {
		if (x < 0 || x >= width || y < 0 || y >= height) return
		const offset = (y * width + x) * 4
		rgba[offset] = rgb[0]
		rgba[offset + 1] = rgb[1]
		rgba[offset + 2] = rgb[2]
		rgba[offset + 3] = 255
	}

	const barHeight = Math.max(8, Math.round(height * 0.22))
	const barTop = height - barHeight - 4
	const barLeft = 4
	const barRight = width - 4
	const barWidth = barRight - barLeft
	const filled = Math.round(barWidth * clamp01(progress))
	const trackColor: RGB = [Math.round(color[0] * 0.22), Math.round(color[1] * 0.22), Math.round(color[2] * 0.22)]
	const headColor: RGB = playing ? [235, 245, 255] : color

	for (let y = barTop; y < barTop + barHeight; y += 1) {
		for (let x = barLeft; x < barRight; x += 1) {
			const isFilled = x - barLeft < filled
			setPixel(x, y, isFilled ? color : trackColor)
		}
	}
	// Playback head line at the current position.
	const headX = barLeft + Math.min(barWidth - 1, filled)
	for (let y = barTop - 2; y < barTop + barHeight + 2; y += 1) setPixel(headX, y, headColor)

	return encodePng(width, height, rgba)
}
