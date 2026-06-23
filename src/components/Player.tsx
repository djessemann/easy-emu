import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "../types";
import { SYSTEMS } from "../systems";
import { EJS_DATA_PATH } from "../emulator/config";
import { getStateBlob, saveState } from "../storage";

interface PlayerProps {
  game: Game;
  /** When true, load the game's saved state automatically once it starts. */
  autoLoad: boolean;
  onExit: () => void;
}

// Keep the in-game menu minimal: only pause and save/load. Everything else
// (settings, speed, shaders, controller remap, cheats, screenshots, …) is
// hidden so there's nothing to fiddle with.
const EJS_BUTTONS = {
  playPause: true,
  saveState: true,
  loadState: true,
  restart: false,
  mute: false,
  settings: false,
  fullscreen: false,
  screenRecord: false,
  gamepad: false,
  cheat: false,
  volume: false,
  saveSavFiles: false,
  loadSavFiles: false,
  quickSave: false,
  quickLoad: false,
  screenshot: false,
  cacheManager: false,
  exitEmulation: false,
  netplay: false,
  diskButton: false,
  contextMenu: false,
} as const;

/**
 * Hosts a single EmulatorJS session inside an isolated <iframe> that loads a
 * real same-origin page (public/emulator.html). Leaving a game unmounts the
 * frame, which reclaims the whole session (JS, WebGL, WASM, audio, the frame
 * loop) at once — the parent app never reloads, which is what was leaving iOS
 * Safari on a blank screen.
 *
 * Because the frame is same-origin we hand it the ROM + config via postMessage
 * and still drive save/load by reaching straight into its window.
 */
export function Player({ game, autoLoad, onExit }: PlayerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const sentRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }, []);

  /** The emulator instance lives on the iframe's window, not ours. */
  function emulatorWindow(): (Window & typeof globalThis) | null {
    return (frameRef.current?.contentWindow as typeof window) ?? null;
  }

  const handleLoad = useCallback(
    async (silentIfMissing = false) => {
      try {
        const blob = await getStateBlob(game.id);
        if (!blob) {
          if (!silentIfMissing) flash("No save yet");
          return;
        }
        const loadState = emulatorWindow()?.EJS_emulator?.gameManager?.loadState;
        if (!loadState) throw new Error("not ready");
        await loadState(new Uint8Array(await blob.arrayBuffer()));
        flash("Loaded");
      } catch {
        flash("Couldn’t load");
      }
    },
    [game.id, flash],
  );

  const handleSave = useCallback(async () => {
    try {
      const getState = emulatorWindow()?.EJS_emulator?.gameManager?.getState;
      if (!getState) throw new Error("not ready");
      const raw = await getState();
      await saveState(game.id, new Blob([raw as BlobPart]));
      flash("Saved");
    } catch {
      flash("Couldn’t save yet");
    }
  }, [game.id, flash]);

  // Listen for lifecycle messages from the emulator frame.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow) return;
      const data = e.data as { type?: string } | null;
      if (!data || typeof data !== "object") return;
      if (data.type === "ejs-started") {
        setStatus("ready");
        // Give the core a beat to settle before injecting a saved state.
        if (autoLoad) window.setTimeout(() => void handleLoad(true), 600);
      } else if (data.type === "ejs-error") {
        setStatus("error");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [autoLoad, handleLoad]);

  // Once the frame's document has loaded (so its message listener is live),
  // hand it the ROM bytes + config. The ArrayBuffer is transferred to avoid a
  // copy; the frame creates its own object URL from it.
  const handleFrameLoad = useCallback(async () => {
    const win = frameRef.current?.contentWindow;
    if (!win || sentRef.current) return;
    sentRef.current = true;

    let rom: ArrayBuffer;
    try {
      rom = await game.data.arrayBuffer();
    } catch {
      setStatus("error");
      return;
    }
    const sys = SYSTEMS[game.system];
    win.postMessage(
      {
        type: "ejs-config",
        core: sys.core,
        name: game.name,
        color: sys.color,
        dataPath: EJS_DATA_PATH,
        buttons: EJS_BUTTONS,
        rom,
      },
      window.location.origin,
      [rom],
    );
  }, [game]);

  return (
    <div className="player">
      <div className="player__bar">
        <button className="btn btn--ghost" onClick={onExit}>
          ← Library
        </button>
        <span className="player__title">{game.name}</span>
        <div className="player__actions">
          <button
            className="btn btn--ghost"
            onClick={handleSave}
            disabled={status !== "ready"}
          >
            Save
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => handleLoad()}
            disabled={status !== "ready"}
          >
            Load
          </button>
        </div>
      </div>

      <div className="player__stage">
        <iframe
          ref={frameRef}
          className="player__game"
          title={game.name}
          src="./emulator.html"
          onLoad={handleFrameLoad}
          allow="autoplay; fullscreen; gamepad"
        />
        {status === "loading" && (
          <div className="player__overlay">Loading core…</div>
        )}
        {status === "error" && (
          <div className="player__overlay player__overlay--error">
            Couldn’t load the emulator core. Check your connection and try
            again.
          </div>
        )}
        {toast && <div className="player__toast">{toast}</div>}
      </div>
    </div>
  );
}
