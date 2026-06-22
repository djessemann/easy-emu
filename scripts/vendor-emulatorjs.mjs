// Assembles a self-hosted EmulatorJS "data" folder into public/ejs-data so the
// emulator engine and cores are served same-origin (and precached by the
// service worker) instead of from the CDN. This is what makes the app fully
// playable offline, and it removes the cross-origin caching that was corrupting
// cores. Run automatically before every build (see package.json "prebuild").
//
// The engine still falls back to the CDN at runtime for anything not vendored
// here, so a missing file degrades to "needs network" rather than breaking.
import { cp, mkdir, rm, readdir, copyFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const engine = path.join(root, "node_modules/@emulatorjs/emulatorjs/data");
const out = path.join(root, "public/ejs-data");

// EJS_core id -> npm package providing that core's wasm builds.
const CORE_PACKAGES = {
  fceumm: "@emulatorjs/core-fceumm", // NES
  gambatte: "@emulatorjs/core-gambatte", // Game Boy / Color
  snes9x: "@emulatorjs/core-snes9x", // SNES
  genesis_plus_gx: "@emulatorjs/core-genesis_plus_gx", // Genesis
};

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, "cores"), { recursive: true });

// Engine: loader + stylesheet + version, plus the unminified src bundle (the
// loader loads these when the minified files are absent), the decompression
// workers, and the localization strings.
for (const file of ["loader.js", "emulator.css", "version.json"]) {
  await copyFile(path.join(engine, file), path.join(out, file));
}
for (const dir of ["src", "compression", "localization"]) {
  await cp(path.join(engine, dir), path.join(out, dir), { recursive: true });
}

// Cores: vendor the non-threaded variants only (we don't enable cross-origin
// isolation, so threaded cores are never requested). Both the WebGL2 and the
// "-legacy" builds are kept so any device finds a usable core offline.
let vendored = 0;
for (const [core, mod] of Object.entries(CORE_PACKAGES)) {
  const dir = path.join(root, "node_modules", mod);
  if (!(await exists(dir))) {
    throw new Error(`Missing core package ${mod} — run npm install`);
  }
  let copiedForCore = 0;
  for (const file of await readdir(dir)) {
    if (file.endsWith("-wasm.data") && !file.includes("-thread")) {
      await copyFile(path.join(dir, file), path.join(out, "cores", file));
      copiedForCore++;
      vendored++;
    }
  }
  if (copiedForCore === 0) {
    throw new Error(`No wasm cores found for ${core} in ${mod}`);
  }
}

console.log(`Vendored EmulatorJS engine + ${vendored} core file(s) into public/ejs-data`);
