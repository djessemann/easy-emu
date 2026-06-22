/**
 * Where the EmulatorJS engine + cores are loaded from at runtime.
 *
 * Defaults to the public EmulatorJS CDN, which works for the web app on any
 * device. For the offline / native iOS build (Capacitor), self-host the
 * EmulatorJS `data` folder and point this at it via the VITE_EJS_DATA_PATH
 * environment variable (it must end with a trailing slash).
 */
export const EJS_DATA_PATH: string =
  import.meta.env.VITE_EJS_DATA_PATH ?? "https://cdn.emulatorjs.org/stable/data/";
