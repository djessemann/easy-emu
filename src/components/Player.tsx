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
 * Hosts a single EmulatorJS session. The in-game menu is stripped down to just
 * save/load (no settings, speed, resolution, etc.); the same actions are also
 * exposed on our own top bar so they're reachable outside the in-game menu.
 * Exiting reloads the app (the library lives in IndexedDB, so it's instant),
 * which guarantees a clean teardown of the emulator.
 */
export function Player({ game, autoLoad, onExit }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [toast, setToast] = useState<string | null>(null);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }

  useEffect(() => {
    const sys = SYSTEMS[game.system];
    const romUrl = URL.createObjectURL(game.data);

    window.EJS_player = "#game";
    window.EJS_core = sys.core;
    window.EJS_gameUrl = romUrl;
    window.EJS_gameName = game.name;
    window.EJS_pathtodata = EJS_DATA_PATH;
    window.EJS_startOnLoaded = true;
    window.EJS_color = sys.color;
    window.EJS_backgroundColor = "#000";

    // Keep the in-game menu minimal: only pause and save/load. Everything else
    // (settings, speed, shaders, controller remap, cheats, screenshots, …) is
    // hidden so there's nothing to fiddle with.
    window.EJS_Buttons = {
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

    window.EJS_onGameStart = () => {
      setStatus("ready");
      if (autoLoad) {
        // Give the core a beat to settle before injecting the state.
        window.setTimeout(() => void handleLoad(true), 600);
      }
    };

    if (!document.getElementById("ejs-loader")) {
      const script = document.createElement("script");
      script.id = "ejs-loader";
      script.src = `${EJS_DATA_PATH}loader.js`;
      script.async = true;
      script.onerror = () => setStatus("error");
      document.body.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  async function handleSave() {
    try {
      const getState = window.EJS_emulator?.gameManager?.getState;
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
      const loadState = window.EJS_emulator?.gameManager?.loadState;
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
        <div id="game" ref={containerRef} className="player__game" />
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
