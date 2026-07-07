# QMapper

Control **QMapper** (video mapping & playback, Android) from Bitfocus Companion over its local HTTP API.

## Setup

1. Make sure QMapper is running on the Android device.
2. Note the device's Wi-Fi IP address (QMapper shows it in its interface / system info).
3. In this module's config, enter:
   - **Host / IP** — the QMapper device IP (e.g. `192.168.1.50`).
   - **Port** — `2226` (default).
   - **Poll interval** — feedback refresh rate (default `400 ms`); lower = smoother progress bar.
   - **Animate** — enables the moving progress bar and pulsing blackout button.

## What you can control

- **Playlist** — play, pause, stop, next, previous, play a specific index, toggle an item, reload, and settings (repeat mode, auto-restart, source transition).
- **Sources** — switch the active source between Playlist, NDI, OMT and SRT (with fade/cut transition).
- **Output** — blackout (toggle / on / off).
- **Warp / mapping** — show the mapping grid, main output visibility, per-layer visibility, colour correction.
- **Sync** — MQTT sync mode (Off / Master / Slave).
- **App** — UI language.

## Notable feedbacks & presets

- **Playlist progress bar (animated)** — a moving progress bar drawn on the button, with the elapsed / remaining time. It interpolates between polls so it advances smoothly.
- **Blackout — pulsing** — the button pulses red while blackout is active.
- **Active source matches**, **Sync mode matches**, **Playlist is playing**, **Mapping grid shown**, **Shuffle enabled**, and more.
- Variables for the current media name, index/count, position/duration/remaining, plus device system info (CPU, FPS, temperature, resolution…).

Check the **Presets** tab for ready-made transport, source-switch, blackout and progress-bar buttons.
