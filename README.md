# companion-module-videopathe-qmapper

A [Bitfocus Companion](https://bitfocus.io/companion) module to control **QMapper**, a video mapping & playback application for Android, through its local HTTP API on port **2226**.

App is available for free on [videopathe.com](https://videopathe.com).

See [HELP.md](./companion/HELP.md) for setup and usage.

## Development

```sh
corepack enable
yarn install
yarn build      # compiles TypeScript to dist/
yarn dev        # watch mode
yarn package    # builds a .tgz for Companion
```

To test in Companion developer mode, point Companion's "Developer modules path" at the folder containing this module, then add a **Videopathe: QMapper** connection.

## API

- `GET /api/status` — aggregated state snapshot (playlist, current media, warp, control, system)
- `GET /api/blackout`, `GET /api/language` — extra state
- `POST /api/playlist/*`, `/api/control/source-switch`, `/api/warp/*`, `/api/blackout`, `/api/language` — commands

QMapper exposes an interactive API documentation inside its own web interface.

## License

MIT
