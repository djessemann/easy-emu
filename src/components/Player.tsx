import { useEffect, useRef, useState } from "react";
import type { Game } from "../types";
import { SYSTEMS } from "../systems";
import { EJS_DATA_PATH } from "../emulator/config";

interface PlayerProps {
  game: Game;
  onExit: () => void;
}

/**
 * Hosts a single EmulatorJS session for one game. EmulatorJS is configured
 * through `window.EJS_*` globals and bootstrapped by its loader script. The
 * engine is hard to tear down cleanly, so exiting reloads the app (the library
 * lives in IndexedDB, so this is instant) — that guarantees no audio bleed or
 * double-initialisation when launching the next game.
 */
export function Player({ game, onExit }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

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
    window.EJS_backgroundColor = "#0f1115";
    window.EJS_onGameStart = () => setStatus("ready");

    // Inject the loader once. Exiting a game reloads the whole app, so we
    // never tear EmulatorJS down in place and cleanup is intentionally
    // minimal; this also makes the setup safe under StrictMode's dev
    // double-invoke (the second pass just refreshes the globals).
    if (!document.getElementById("ejs-loader")) {
      const script = document.createElement("script");
      script.id = "ejs-loader";
      script.src = `${EJS_DATA_PATH}loader.js`;
      script.async = true;
      script.onerror = () => setStatus("error");
      document.body.appendChild(script);
    }
  }, [game]);

  return (
    <div className="player">
      <div className="player__bar">
        <button className="btn btn--ghost" onClick={onExit}>
          ← Library
        </button>
        <span className="player__title">{game.name}</span>
        <span className="player__tag">{SYSTEMS[game.system].tag}</span>
      </div>

      <div className="player__stage">
        <div id="game" ref={containerRef} className="player__game" />
        {status === "loading" && (
          <div className="player__overlay">Loading core…</div>
        )}
        {status === "error" && (
          <div className="player__overlay player__overlay--error">
            Couldn’t load the emulator core. Check your connection (cores load
            from the EmulatorJS CDN), then try again.
          </div>
        )}
      </div>
    </div>
  );
}
