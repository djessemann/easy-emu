/**
 * The only EmulatorJS runtime value app code touches: the emulator instance the
 * loader assigns to `window.EJS_emulator`, used for save/load. Every other
 * `EJS_*` config global is set inside emulator.html (plain JS), so it needs no
 * type here. See https://emulatorjs.org/docs/options.
 */
export {};

interface EJSGameManager {
  /** Returns the current save state as raw bytes (may be sync or async). */
  getState?: () => Uint8Array | Promise<Uint8Array>;
  /** Restores a save state from raw bytes. */
  loadState?: (state: Uint8Array) => void | Promise<void>;
}

interface EJSEmulator {
  gameManager?: EJSGameManager;
}

declare global {
  interface Window {
    EJS_emulator?: EJSEmulator;
  }
}
