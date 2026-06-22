/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override the EmulatorJS data/cores path (must end with a slash). */
  readonly VITE_EJS_DATA_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
