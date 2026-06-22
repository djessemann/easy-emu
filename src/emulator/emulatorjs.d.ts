/**
 * Minimal typings for the EmulatorJS global configuration variables we set.
 * EmulatorJS is configured entirely through `window.EJS_*` globals that its
 * loader script reads on startup. See https://emulatorjs.org/docs/options.
 */
export {};

interface EJSEmulator {
  /** Tear-down hook exposed by EmulatorJS to stop and clean up the instance. */
  callEvent?: (event: string) => void;
  elements?: { parent?: HTMLElement };
  pause?: () => void;
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
    EJS_defaultOptions?: Record<string, string>;
    EJS_Buttons?: Record<string, boolean>;
    EJS_onGameStart?: () => void;
    EJS_emulator?: EJSEmulator;
  }
}
