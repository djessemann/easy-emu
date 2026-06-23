import type { SystemDef, SystemId } from "./types";

/**
 * The four systems easy-emu supports. Keeping this list fixed (one core per
 * system, no options) is what keeps the app simple. Adding a console later is
 * just one more entry here plus its EmulatorJS core id.
 */
export const SYSTEMS: Record<SystemId, SystemDef> = {
  nes: {
    id: "nes",
    name: "Nintendo (NES)",
    core: "nes",
    tag: "NES",
    extensions: ["nes"],
    color: "#e5484d",
  },
  gb: {
    id: "gb",
    name: "Game Boy / Color",
    core: "gb",
    tag: "GB",
    extensions: ["gb", "gbc"],
    color: "#46a758",
  },
  snes: {
    id: "snes",
    name: "Super Nintendo (SNES)",
    core: "snes",
    tag: "SNES",
    extensions: ["smc", "sfc"],
    color: "#8e4ec6",
  },
  genesis: {
    id: "genesis",
    name: "Sega Genesis",
    core: "segaMD",
    tag: "GEN",
    extensions: ["md", "gen", "smd", "bin"],
    color: "#3e63dd",
  },
};

const SYSTEM_LIST: SystemDef[] = Object.values(SYSTEMS);

/**
 * Guess a system from a file name's extension. Returns null when the extension
 * isn't recognised. Note `.bin` is ambiguous but is mapped to Genesis here,
 * which is its most common use among these four systems.
 */
export function detectSystem(fileName: string): SystemId | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  for (const sys of SYSTEM_LIST) {
    if (sys.extensions.includes(ext)) return sys.id;
  }
  return null;
}

/** Strip the extension and tidy a file name into a display title. */
export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base.replace(/[._]+/g, " ").trim() || fileName;
}
