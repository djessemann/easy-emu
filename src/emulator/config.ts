/**
 * Where the EmulatorJS engine + cores are loaded from at runtime.
 *
 * Defaults to the self-hosted `ejs-data` folder, which is assembled at build
 * time from the @emulatorjs/* npm packages (see scripts/vendor-emulatorjs.mjs)
 * and precached by the service worker — so the app plays fully offline. The
 * engine still falls back to the EmulatorJS CDN at runtime for anything not
 * vendored locally. Override with VITE_EJS_DATA_PATH (must end in a slash).
 */
export const EJS_DATA_PATH: string =
  import.meta.env.VITE_EJS_DATA_PATH ?? "./ejs-data/";
