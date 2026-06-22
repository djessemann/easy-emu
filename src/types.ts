/** A supported console. The `core` value is the EmulatorJS libretro core id. */
export type SystemId = "nes" | "gb" | "snes" | "genesis";

export interface SystemDef {
  id: SystemId;
  /** Human-readable name shown in the UI. */
  name: string;
  /** EmulatorJS core identifier (libretro core). */
  core: string;
  /** Short tag shown on game cards. */
  tag: string;
  /** File extensions (lowercase, no dot) that map to this system. */
  extensions: string[];
  /** Accent color used on cards for this system. */
  color: string;
}

/** A ROM the user has imported, persisted in IndexedDB. */
export interface Game {
  id: string;
  name: string;
  system: SystemId;
  /** File name the ROM was imported as. */
  fileName: string;
  /** Raw ROM bytes. */
  data: Blob;
  addedAt: number;
}
