import { useEffect, useRef, useState } from "react";
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

/**
 * Hosts a single EmulatorJS session inside an isolated <iframe>.
 *
 * The iframe is the key to a clean exit: EmulatorJS has no reliable teardown,
 * so when the user leaves we simply unmount the frame and the browser reclaims
 * the entire session (JS, WebGL, WASM, audio, the animation loop) at once. The
 * parent app never reloads — which matters on iOS Safari, where reloading right
 * after a WebGL/WASM session frequently leaves the tab stuck on a blank screen.
 *
 * The frame is same-origin (an about:blank document we write into), so we can
 * still drive save/load by reaching straight into its window.
 */
export function Player({ game, autoLoad, onExit }: PlayerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [toast, setToast] = useState<string | null>(null);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }

  /** The emulator instance lives on the iframe's window, not ours. */
  function emulatorWindow(): (Window & typeof globalThis) | null {
    return (frameRef.current?.contentWindow as typeof window) ?? null;
  }

  useEffect(() => {
    const frame = frameRef.current;
    const win = frame?.contentWindow as (Window & Record<string, unknown>) | null;
    const doc = frame?.contentDocument;
    if (!win || !doc) {
      setStatus("error");
      return;
    }

    const sys = SYSTEMS[game.system];
    const romUrl = URL.createObjectURL(game.data);

    // A minimal black document for the emulator to mount into. Pixel scaling is
    // declared here because the parent stylesheet doesn't reach inside the frame.
    doc.open();
    doc.write(
      `<!doctype html><html><head>` +
        `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">` +
        `<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}` +
        `#game{width:100%;height:100%}` +
        `#game canvas{image-rendering:pixelated;image-rendering:crisp-edges}</style>` +
        `</head><body><div id="game"></div></body></html>`,
    );
    doc.close();

    win.EJS_player = "#game";
    win.EJS_core = sys.core;
    win.EJS_gameUrl = romUrl;
    win.EJS_gameName = game.name;
    win.EJS_pathtodata = EJS_DATA_PATH;
    win.EJS_startOnLoaded = true;
    win.EJS_color = sys.color;
    win.EJS_backgroundColor = "#000";

    // Keep the in-game menu minimal: only pause and save/load. Everything else
    // (settings, speed, shaders, controller remap, cheats, screenshots, …) is
    // hidden so there's nothing to fiddle with.
    win.EJS_Buttons = {
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
    };

    win.EJS_onGameStart = () => {
      setStatus("ready");
      if (autoLoad) {
        // Give the core a beat to settle before injecting the state.
        win.setTimeout(() => void handleLoad(true), 600);
      }
    };

    const script = doc.createElement("script");
    script.src = `${EJS_DATA_PATH}loader.js`;
    script.async = true;
    script.onerror = () => setStatus("error");
    doc.body.appendChild(script);

    return () => {
      URL.revokeObjectURL(romUrl);
      // The frame (and the whole emulator session inside it) is torn down by
      // React unmounting the iframe element — nothing else to clean up.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  async function handleSave() {
    try {
      const getState = emulatorWindow()?.EJS_emulator?.gameManager?.getState;
      if (!getState) throw new Error("not ready");
      const raw = await getState();
      await saveState(game.id, new Blob([raw as BlobPart]));
      flash("Saved");
    } catch {
      flash("Couldn’t save yet");
    }
  }

  async function handleLoad(silentIfMissing = false) {
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
  }

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
