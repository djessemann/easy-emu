/**
 * Minimal typings for the EmulatorJS global configuration variables and the
 * runtime instance we interact with. EmulatorJS is configured through
 * `window.EJS_*` globals read by its loader script.
 * See https://emulatorjs.org/docs/options.
 */
export {};

interface EJSGameManager {
  /** Returns the current save state as raw bytes (may be sync or async). */
  getState?: () => Uint8Array | Promise<Uint8Array>;
  /** Restores a save state from raw bytes. */
  loadState?: (state: Uint8Array) => void | Promise<void>;
  [key: string]: unknown;
}

interface EJSEmulator {
  gameManager?: EJSGameManager;
  elements?: { parent?: HTMLElement };
  pause?: () => void;
  play?: () => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_gameName?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_color?: string;
    EJS_backgroundColor?: string;
    EJS_volume?: number;
    EJS_threads?: boolean;
    EJS_defaultOptions?: Record<string, string>;
    /** Show/hide individual menu buttons. */
    EJS_Buttons?: Record<string, boolean>;
    EJS_onGameStart?: () => void;
    EJS_emulator?: EJSEmulator;
  }
}
