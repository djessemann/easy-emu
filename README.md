# easy-emu

A dead-simple, mobile-first emulator for **NES**, **Game Boy / Color**, **SNES**
and **Sega Genesis**. Built as a web app first, with a clear path to a native
iOS app.

It's deliberately minimal — no per-core options, no shader menus, no
remapping. Just: add a game → tap it → play. Think "Delta, but much simpler."

## How it works

The hard part of an emulator (CPU/PPU/audio emulation) is handled by mature
open-source **libretro** cores compiled to WebAssembly, loaded through
[EmulatorJS](https://emulatorjs.org). easy-emu is the **shell** around them:

- a clean React UI (game library, import, launch),
- a single shared abstraction so every console plugs in the same way
  (`src/systems.ts` + `src/components/Player.tsx`),
- local persistence of your ROMs in IndexedDB (`src/storage.ts`),
- on-screen touch controls (provided by EmulatorJS on touch devices),
- PWA support so it installs to the iOS home screen and runs fullscreen.

Adding a fifth system later is one entry in `src/systems.ts` plus its core id.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build    # outputs static files to ./dist
npm run preview
```

By default the emulator cores stream from the public EmulatorJS CDN, so the dev
machine / phone needs internet on first load. To pin or self-host the cores,
copy `.env.example` to `.env` and set `VITE_EJS_DATA_PATH`.

## ROMs & the law

**easy-emu ships no games or BIOS files.** Add only ROMs you are legally
entitled to play. Supported extensions:

| System         | Extensions                 |
| -------------- | -------------------------- |
| NES            | `.nes`                     |
| Game Boy / GBC | `.gb` `.gbc`               |
| SNES           | `.smc` `.sfc`              |
| Sega Genesis   | `.md` `.gen` `.smd` `.bin` |

(`.bin` is assumed to be Genesis.)

## Path to a native iOS app

The app is a static SPA built with a relative base path, so the same code can
be wrapped — with **no rewrite** — into a real App Store app using
[Capacitor](https://capacitorjs.com):

```bash
npm install @capacitor/core @capacitor/cli
npx cap init easy-emu com.example.easyemu --web-dir=dist
npm run build
npx cap add ios
npx cap sync
npx cap open ios        # build & run in Xcode (requires macOS)
```

For a native build you should **self-host the EmulatorJS `data` folder** inside
the app bundle (copy it into `public/emulatorjs/` and set
`VITE_EJS_DATA_PATH=./emulatorjs/`) so games work fully offline.

## Project layout

```
src/
  systems.ts              # the 4 supported consoles + file-extension detection
  storage.ts              # IndexedDB-backed game library
  types.ts                # shared types
  App.tsx                 # library <-> player routing
  components/
    Library.tsx           # game grid + ROM import
    Player.tsx            # EmulatorJS session host
  emulator/
    config.ts             # core/data path
    emulatorjs.d.ts       # typings for the EJS_* globals
```

## Status

v1 scaffold: import ROMs, browse a library, and play all four systems with
save states and touch controls (the latter two come from EmulatorJS). Possible
next steps: bundled homebrew demo ROMs, custom save-state slots with
screenshots, self-hosted cores for offline play, and the Capacitor iOS wrapper.
